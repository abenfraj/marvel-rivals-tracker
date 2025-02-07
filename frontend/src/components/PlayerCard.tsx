import React from 'react';
import { User, Star } from 'lucide-react';

interface HeroStats {
  winRate: number;
  wins: number;
  losses: number;
  kda: number;
  kills: number;
  deaths: number;
  assists: number;
}

interface Hero {
  name: string;
  imageUrl: string;
  stats?: HeroStats;
}

interface PlayerCardProps {
  player: {
    playerName: string;
    heroes: Hero[];
  };
}

const getPerformanceDetails = (winRate: number, wins: number, losses: number) => {
  // Minimum games threshold to evaluate performance
  const minGames = 10;
  const totalGames = wins + losses;

  if (totalGames < minGames) {
    return {
      label: "New",
      color: "text-blue-400",
      circleColor: "text-blue-500",
      bgColor: "bg-blue-400/20"
    };
  }

  if (winRate >= 55) {
    return {
      label: "Good",
      color: "text-green-400",
      circleColor: "text-green-500",
      bgColor: "bg-green-400/20"
    };
  } else if (winRate >= 45) {
    return {
      label: "Average",
      color: "text-yellow-400",
      circleColor: "text-yellow-500",
      bgColor: "bg-yellow-400/20"
    };
  } else {
    return {
      label: "Bad",
      color: "text-red-400",
      circleColor: "text-red-500",
      bgColor: "bg-red-400/20"
    };
  }
};

const CircularProgress: React.FC<{ percentage: number, color: string }> = ({ percentage, color }) => {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="transform -rotate-90 w-9 h-9">
        <circle
          className="text-gray-700"
          strokeWidth="3"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="18"
          cy="18"
        />
        <circle
          className={color}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="18"
          cy="18"
        />
      </svg>
    </div>
  );
};

const getPerformanceScore = (winRate: number, wins: number, losses: number) => {
  const totalGames = wins + losses;
  if (totalGames < 10) return -1; // New players at the end
  return winRate;
};

const sortHeroes = (heroes: Hero[]) => {
  return [...heroes].sort((a, b) => {
    const scoreA = getPerformanceScore(
      a.stats?.winRate || 0,
      a.stats?.wins || 0,
      a.stats?.losses || 0
    );
    const scoreB = getPerformanceScore(
      b.stats?.winRate || 0,
      b.stats?.wins || 0,
      b.stats?.losses || 0
    );
    return scoreB - scoreA; // Descending order
  });
};

const formatStat = (value: number) => {
  return value.toFixed(1);
};

const PlayerCard: React.FC<PlayerCardProps> = ({ player }) => {
  if (!player || !player.heroes) {
    return null;
  }

  const sortedHeroes = sortHeroes(player.heroes);

  return (
    <div className="bg-black rounded-lg p-3 h-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1 bg-red-500/10 rounded-full">
          <User className="w-5 h-5 text-red-500" />
        </div>
        <h3 className="text-white font-bold">
          {player.playerName || 'Unknown Player'}
        </h3>
      </div>

      <div>
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
          <Star className="w-3 h-3 text-yellow-500" />
          Most Played Characters
        </div>

        <div className="space-y-3">
          {sortedHeroes.map((hero, index) => {
            const performance = getPerformanceDetails(
              hero.stats?.winRate || 0,
              hero.stats?.wins || 0,
              hero.stats?.losses || 0
            );

            return (
              <div 
                key={`${hero.name}-${index}`} 
                className="bg-gradient-to-r from-gray-800/50 to-gray-900/30 rounded-lg p-2 hover:from-gray-800/70 hover:to-gray-900/50 transition-all"
              >
                <div className="flex items-center gap-2">
                  {hero.imageUrl && (
                    <img 
                      src={hero.imageUrl} 
                      alt={hero.name}
                      className="w-8 h-8 rounded object-cover"
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <div className="text-white text-sm">{hero.name}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${performance.bgColor} ${performance.color} font-medium`}>
                      {performance.label}
                    </span>
                  </div>
                </div>

                {hero.stats && (
                  <div className="pl-2 space-y-2 mt-2">
                    {/* Win Rate Section */}
                    <div className="flex items-center gap-3">
                      <CircularProgress 
                        percentage={hero.stats.winRate} 
                        color={performance.circleColor}
                      />
                      <div className="flex items-center gap-3">
                        <span className={`font-bold text-base min-w-[52px] ${performance.color}`}>
                          {hero.stats.winRate}%
                        </span>
                        <div className="text-sm font-medium">
                          <div className="text-green-400">{hero.stats.wins}W</div>
                          <div className="text-red-400">{hero.stats.losses}L</div>
                        </div>
                      </div>
                    </div>

                    {/* KDA Section */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400">KDA</span>
                        <span className="text-white font-bold">{hero.stats.kda}</span>
                      </div>
                      <div className="flex gap-4 text-xs">
                        <div>
                          <span className="text-gray-500 mr-1">K</span>
                          <span className="text-green-400 font-bold">{formatStat(hero.stats.kills)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 mr-1">D</span>
                          <span className="text-red-400 font-bold">{formatStat(hero.stats.deaths)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 mr-1">A</span>
                          <span className="text-blue-400 font-bold">{formatStat(hero.stats.assists)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;