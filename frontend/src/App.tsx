import React, { useState } from 'react';
import { Upload, Search, Github, Twitter, Info } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import UploadZone from './components/UploadZone';
import PlayerCard from './components/PlayerCard';
import ManualInput from './components/ManualInput';
import { toast, Toaster } from 'react-hot-toast';

interface Hero {
  name: string;
  imageUrl: string;
  stats?: {
    winRate: number;
    wins: number;
    losses: number;
    kda: number;
    kills: number;
    deaths: number;
    assists: number;
  };
}

interface Player {
  playerName: string;
  characters: string[];
}

interface TrackerResults {
  status: string;
  message: string;
  playerName: string;
  heroes: Hero[];
}

interface BanRecommendation {
  hero: Hero;
  reason: string;
  priority: number;
}

const generateBanRecommendations = (results: TrackerResults[]): BanRecommendation[] => {
  const recommendations: BanRecommendation[] = [];
  const seenHeroes = new Set<string>();

  results.forEach(result => {
    if (result.status !== 'success' || !result.heroes) return;

    result.heroes.forEach(hero => {
      if (seenHeroes.has(hero.name)) return; // Skip if we've already seen this hero
      
      if (hero.stats) {
        let priority = 0;
        let reason = '';

        // Calculate priority based on different factors
        if (hero.stats.winRate > 55 && hero.stats.wins + hero.stats.losses >= 10) {
          priority += hero.stats.winRate * (hero.stats.wins + hero.stats.losses) / 10;
          reason = `${result.playerName} has ${hero.stats.winRate.toFixed(1)}% win rate with ${hero.stats.wins + hero.stats.losses} games`;
        }

        if (hero.stats.kda > 3.0 && hero.stats.wins + hero.stats.losses >= 10) {
          priority += hero.stats.kda * 10;
          reason = reason || `${result.playerName} has ${hero.stats.kda.toFixed(1)} KDA with ${hero.name}`;
        }

        if (hero.stats.wins + hero.stats.losses >= 20) {
          priority += 90;
          reason = reason || `${result.playerName} mainly plays ${hero.name} (${hero.stats.wins + hero.stats.losses} games)`;
        }

        if (priority > 0) {
          recommendations.push({
            hero,
            reason,
            priority
          });
          seenHeroes.add(hero.name);
        }
      }
    });
  });

  // Sort by priority and get top 5
  return recommendations
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5);
};

const generateBanSummaryText = (recommendations: BanRecommendation[]): string => {
  return recommendations
    .map((ban, index) => `${index + 1}. Ban ${ban.hero.name} - ${ban.reason}`)
    .join('\n');
};

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [imageText, setImageText] = useState<string>('');
  const [inputMethod, setInputMethod] = useState<'upload' | 'manual'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [trackerResults, setTrackerResults] = useState<TrackerResults | null>(null);
  const [banRecommendations, setBanRecommendations] = useState<BanRecommendation[]>([]);

  // First, define your heroes
  const [heroes] = useState<Hero[]>([
  ]);

  // Transform heroes into the format PlayerCard expects
  const playerData: Player = {
    playerName: "Player 1",
    characters: heroes.map(hero => hero.name)
  };

  const processImage = async (file: File) => {
    try {
      console.log('processImage started with file:', file.name);
      const formData = new FormData();
      formData.append('image', file);
      
      console.log('Sending request to upload endpoint...');
      const response = await fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to process image');
      }

      setImageText(`Detected Text from Image:\n${data.extractedText}`);
      setExtractedText(data.extractedText);
      
      // Handle multiple tracker results
      if (data.trackerResults && Array.isArray(data.trackerResults)) {
        setTrackerResults(data.trackerResults);
        return data.trackerResults;
      } else if (data.trackerResults) {
        // If single result, wrap in array
        setTrackerResults([data.trackerResults]);
        return [data.trackerResults];
      }
      
      return [];
    } catch (error) {
      console.error('Error in processImage:', error);
      throw error;
    }
  };

  const handleFileUpload = async (file: File) => {
    console.log('handleFileUpload called with file:', file.name);
    setIsProcessing(true);
    setImageText('');
    setSelectedFile(file);
    
    try {
      console.log('Calling processImage directly');
      const newResults = await processImage(file);
      setResults(newResults);
      if (newResults && newResults.length > 0) {
        const recommendations = generateBanRecommendations(newResults);
        setBanRecommendations(recommendations);
      }
    } catch (error) {
      console.error('Error handling file upload:', error);
      setImageText('Error processing image. Please try again.');
      toast.error('Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (players: Array<{ playerName: string, characters: string[] }>) => {
    setResults(players);
    setImageText('');
  };

  const handleReset = () => {
    // Store current trackerResults in results before clearing
    if (trackerResults) {
      const newResults = Array.isArray(trackerResults) 
        ? trackerResults.filter(result => result.status === 'success')
        : trackerResults.status === 'success' ? [trackerResults] : [];
      
      setResults(prevResults => [...newResults, ...prevResults]);
    }
    
    // Clear current search states
    setTrackerResults(null);
    setImageText('');
    setInputMethod('upload');
    setSelectedFile(null);
    setExtractedText('');
  };

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Ban recommendations copied to clipboard!', {
        duration: 2000,
        position: 'top-center',
        style: {
          background: '#1f2937',
          color: '#fff',
          border: '1px solid rgba(239, 68, 68, 0.2)',
        }
      });
    } catch (err) {
      toast.error('Failed to copy text');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-900 via-red-900 to-gray-900">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 mb-4 animate-pulse">
            Marvel Rivals Tracker
          </h1>
          <p className="text-gray-300 text-xl mb-8">
            Track your Marvel Rivals stats
          </p>

          {/* Add Ban Recommendations at the top */}
          {banRecommendations.length > 0 && (
            <div className="mt-4 mb-8">
              <h2 className="text-2xl font-bold text-red-400 mb-4">Recommended Bans</h2>
              <div className="flex justify-center items-center gap-8 max-w-7xl mx-auto">
                {/* Hero images grid - changed from items-center to items-start */}
                <div className="flex justify-center items-start gap-4 mt-8">
                  {banRecommendations.map((ban, index) => (
                    <div key={ban.hero.name} className="relative group">
                      <div className="absolute -top-4 -right-4 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold z-10">
                        #{index + 1}
                      </div>
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden border-2 border-red-500">
                        <img 
                          src={ban.hero.imageUrl} 
                          alt={ban.hero.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        {ban.reason}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Text summary box */}
                <div className="w-[500px] bg-black/40 rounded-lg p-4 border border-red-500/20">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-red-400 font-semibold">Ban Summary</h3>
                    <button
                      onClick={() => handleCopyText(generateBanSummaryText(banRecommendations))}
                      className="text-sm px-4 py-2 bg-red-600/20 text-red-400 rounded-full hover:bg-red-600/30 transition-all flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy
                    </button>
                  </div>
                  <div className="text-gray-300 text-sm space-y-2">
                    {banRecommendations.map((ban, index) => (
                      <p key={index}>
                        {index + 1}. Ban {ban.hero.name} - {ban.reason}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {isProcessing && (
            <div className="flex justify-center items-center my-8">
              <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-red-500"></div>
            </div>
          )}

          {!trackerResults && (
            <div className="flex justify-center space-x-4 mb-8">
              <button
                onClick={() => setInputMethod('upload')}
                className={`px-6 py-2 rounded-full transition-all ${
                  inputMethod === 'upload'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                }`}
              >
                Upload Screenshot
              </button>
              <button
                onClick={() => setInputMethod('manual')}
                className={`px-6 py-2 rounded-full transition-all ${
                  inputMethod === 'manual'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800'
                }`}
              >
                Manual Entry
              </button>
            </div>
          )}
        </div>

        {trackerResults && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {Array.isArray(trackerResults) ? (
                trackerResults.map((result, index) => (
                  result.status === 'success' && (
                    <PlayerCard key={`tracker-${index}`} player={result} />
                  )
                ))
              ) : (
                trackerResults.status === 'success' && <PlayerCard player={trackerResults} />
              )}
            </div>
            
            <div className="mt-8 text-center">
              <button
                onClick={handleReset}
                className="bg-red-600/20 text-red-400 px-6 py-2 rounded-full hover:bg-red-600/30 transition-all"
              >
                Start Over
              </button>
            </div>
          </>
        )}

        {!trackerResults && inputMethod === 'upload' && (
          <>
            <UploadZone 
              onFileUpload={handleFileUpload}
              isProcessing={isProcessing}
            />
            
            <div className="mt-16 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6 border border-red-500/20">
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <Info className="w-6 h-6 text-red-500 mr-2" />
                    How It Works
                  </h3>
                  <p className="text-gray-300">
                    Simply upload a screenshot from your Marvel Rivals match, and our tracker will automatically detect player names and their chosen characters. Track your progress and analyze your gameplay patterns over time.
                  </p>
                </div>
                
                <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6 border border-red-500/20">
                  <h3 className="text-xl font-semibold text-white mb-4">Tips</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• Take clear screenshots of the loading screen before the game starts</li>
                    <li>• Ensure player names are visible</li>
                    <li>• Supported formats: PNG, JPG, JPEG</li>
                    <li>• Manual entry is available if you wish to type the names yourself</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {!trackerResults && inputMethod === 'manual' && (
          <ManualInput onSubmit={handleManualSubmit} />
        )}

        {results.length > 0 && !trackerResults && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-red-400 mb-6 text-center">Previous Searches</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((player, index) => (
                <div key={`previous-${index}`} className="transform scale-90">
                  <PlayerCard player={player} />
                </div>
              ))}
            </div>
          </div>
        )}

        {imageText && (
          <div className="my-8 p-6 bg-black/40 rounded-lg border border-red-500/20">
            <h2 className="text-red-400 font-semibold mb-4">Image Analysis</h2>
            <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono overflow-x-auto">
              {imageText}
            </pre>
          </div>
        )}
      </main>

      <Footer />
      <Toaster />
    </div>
  );
}

export default App;