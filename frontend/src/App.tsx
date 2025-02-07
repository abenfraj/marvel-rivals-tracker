import React, { useState } from 'react';
import { Upload, Search, Github, Twitter, Info } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import UploadZone from './components/UploadZone';
import PlayerCard from './components/PlayerCard';
import ManualInput from './components/ManualInput';
import { toast } from 'react-hot-toast';

interface Hero {
  name: string;
  imageUrl: string;
}

interface Player {
  playerName: string;
  characters: string[];
}

interface TrackerResults {
  status: string;
  message: string;
  playerName: string;
  heroes: Array<{
    name: string;
    imageUrl: string;
  }>;
}

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [imageText, setImageText] = useState<string>('');
  const [inputMethod, setInputMethod] = useState<'upload' | 'manual'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [trackerResults, setTrackerResults] = useState<TrackerResults | null>(null);

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
      setTrackerResults(data.trackerResults);
      
      if (data.trackerResults) {
        const playerResults = Object.entries(data.trackerResults).map(([playerName, characters]) => {
          return {
            playerName,
            characters: Array.isArray(characters) ? characters : []
          };
        });
        return playerResults;
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
    setResults([]);
    setImageText('');
    setInputMethod('upload');
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

          {!results.length && (
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

        {!results.length && inputMethod === 'upload' && (
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

        {!results.length && inputMethod === 'manual' && (
          <ManualInput onSubmit={handleManualSubmit} />
        )}

        {isProcessing && (
          <div className="flex justify-center items-center my-12">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-red-500"></div>
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

        {trackerResults && trackerResults.status === 'success' && (
          <div className="mt-8">
            <PlayerCard player={trackerResults} />
          </div>
        )}

        {results.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {results.map((player, index) => (
                <PlayerCard key={index} player={player} />
              ))}
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
      </main>

      <Footer />
    </div>
  );
}

export default App;