import React from 'react';
import { User, Star } from 'lucide-react';
import '../styles/animations.css';

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

interface RoleStats {
  winRate: number;
  wins: number;
  kda: number;
  kills: number;
  deaths: number;
  assists: number;
}

interface Role {
  name: string;
  imageUrl: string;
  percentage: number;
  stats: RoleStats;
}

interface PlayerCardProps {
  player: {
    playerName: string;
    heroes: Hero[];
    roles: Role[];
  };
}

const getPerformanceDetails = (value: number, type: 'winrate' | 'kda') => {
  if (type === 'winrate') {
    if (value >= 55) return { label: "Good WR", color: "text-green-400", bgColor: "bg-green-400/20" };
    if (value >= 45) return { label: "Avg WR", color: "text-yellow-400", bgColor: "bg-yellow-400/20" };
    return { label: "Bad WR", color: "text-red-400", bgColor: "bg-red-400/20" };
  } else {
    if (value >= 3.0) return { label: "Good KDA", color: "text-green-400", bgColor: "bg-green-400/20" };
    if (value >= 2.0) return { label: "Avg KDA", color: "text-yellow-400", bgColor: "bg-yellow-400/20" };
    return { label: "Bad KDA", color: "text-red-400", bgColor: "bg-red-400/20" };
  }
};

const getRolePerformance = (percentage: number) => {
  if (percentage >= 40) return { color: "text-green-500", bgColor: "bg-green-500/20" };
  if (percentage >= 20) return { color: "text-yellow-500", bgColor: "bg-yellow-500/20" };
  return { color: "text-blue-500", bgColor: "bg-blue-500/20" };
};

const CircularProgress: React.FC<{ percentage: number; color: string; showText?: boolean }> = ({ 
  percentage, 
  color, 
  showText = true 
}) => {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="transform -rotate-90 w-8 h-8">
        <circle
          className="text-gray-700"
          strokeWidth="3"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="16"
          cy="16"
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
          cx="16"
          cy="16"
        />
      </svg>
      {showText && (
        <span className="absolute text-[10px] text-white font-bold">{percentage.toFixed(0)}%</span>
      )}
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

const sortRoles = (roles: Role[]) => {
  return [...roles].sort((a, b) => {
    const scoreA = getPerformanceScore(a.stats.winRate, a.stats.wins, 0);
    const scoreB = getPerformanceScore(b.stats.winRate, b.stats.wins, 0);
    return scoreB - scoreA;
  });
};

const getCardStyle = (winRate: number) => {
  if (winRate >= 60) return "card-shine relative overflow-hidden bg-gradient-to-r from-gray-800/50 via-gray-700/50 to-gray-900/30";
  if (winRate <= 40) return "card-warning relative overflow-hidden bg-gradient-to-r from-red-900/30 via-gray-800/50 to-red-900/30";
  return "bg-gradient-to-r from-gray-800/50 to-gray-900/30";
};

const PlayerCard: React.FC<PlayerCardProps> = ({ player }) => {
  if (!player || !player.heroes) {
    return null;
  }

  const sortedHeroes = sortHeroes(player.heroes);
  const sortedRoles = sortRoles(player.roles || []);

  return (
    <div className="bg-black rounded-lg p-3 h-full flex flex-col justify-center">
      <div className="text-white text-lg font-medium mb-2">{player.playerName}</div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Roles Section */}
        {player.roles && player.roles.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
              <span className="text-white font-medium">Roles</span>
            </div>
            
            <div className="grid gap-3">
              {sortedRoles.map((role, index) => (
                <RoleCard key={`${role.name}-${index}`} role={role} />
              ))}
            </div>
          </div>
        )}

        {/* Heroes Section */}
        <div>
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
            <Star className="w-3 h-3 text-yellow-500" />
            <span>Most Played Characters</span>
          </div>

          <div className="grid gap-3">
            {sortedHeroes.map((hero, index) => (
              <HeroCard key={`${hero.name}-${index}`} hero={hero} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Extract Role card to a separate component for cleaner code
const RoleCard: React.FC<{ role: Role }> = ({ role }) => {
  const rolePerf = getRolePerformance(role.percentage);
  const wrPerf = getPerformanceDetails(role.stats.winRate, 'winrate');
  const kdaPerf = getPerformanceDetails(role.stats.kda, 'kda');
  const cardStyle = getCardStyle(role.stats.winRate);

  return (
    <div className={`${cardStyle} rounded-lg p-3 relative overflow-hidden`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4 min-w-0">
          <img src={role.imageUrl} alt={role.name} className="w-6 h-6 rounded-full flex-shrink-0" />
          <span className="text-white text-sm truncate">{role.name}</span>
          <CircularProgress percentage={role.percentage} color={rolePerf.color} />
        </div>
      </div>

      <div className="flex gap-2 mb-2">
        <span className={`text-xs px-2 py-0.5 rounded-full ${wrPerf.bgColor} ${wrPerf.color} font-medium whitespace-nowrap`}>
          {wrPerf.label}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${kdaPerf.bgColor} ${kdaPerf.color} font-medium whitespace-nowrap`}>
          {kdaPerf.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-400">WR </span>
          <span className="text-white font-bold">{role.stats.winRate}%</span>
          <span className="text-green-400 ml-2">{role.stats.wins}W</span>
        </div>
        <div>
          <span className="text-gray-400">KDA </span>
          <span className="text-white font-bold">{role.stats.kda}</span>
          <div className="flex gap-2">
            <span className="text-green-400">K{formatStat(role.stats.kills)}</span>
            <span className="text-red-400">D{formatStat(role.stats.deaths)}</span>
            <span className="text-blue-400">A{formatStat(role.stats.assists)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Extract Hero card to a separate component for cleaner code
const HeroCard: React.FC<{ hero: Hero }> = ({ hero }) => {
  const wrPerf = getPerformanceDetails(hero.stats.winRate, 'winrate');
  const kdaPerf = getPerformanceDetails(hero.stats.kda, 'kda');
  const cardStyle = getCardStyle(hero.stats.winRate);

  return (
    <div className={`${cardStyle} rounded-lg p-3 relative overflow-hidden`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4 min-w-0">
          <img src={hero.imageUrl} alt={hero.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
          <span className="text-white text-sm truncate">{hero.name}</span>
          <CircularProgress 
            percentage={hero.stats.winRate} 
            color={wrPerf.color}
            showText={false}
          />
        </div>
      </div>

      <div className="flex gap-2 mb-2">
        <span className={`text-xs px-2 py-0.5 rounded-full ${wrPerf.bgColor} ${wrPerf.color} font-medium whitespace-nowrap`}>
          {wrPerf.label}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${kdaPerf.bgColor} ${kdaPerf.color} font-medium whitespace-nowrap`}>
          {kdaPerf.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-400">WR </span>
          <span className="text-white font-bold">{hero.stats.winRate}%</span>
          <span className="text-green-400 ml-2">{hero.stats.wins}W</span>
          <span className="text-red-400 ml-1">{hero.stats.losses}L</span>
        </div>
        <div>
          <span className="text-gray-400">KDA </span>
          <span className="text-white font-bold">{hero.stats.kda}</span>
          <div className="flex gap-2">
            <span className="text-green-400">K{formatStat(hero.stats.kills)}</span>
            <span className="text-red-400">D{formatStat(hero.stats.deaths)}</span>
            <span className="text-blue-400">A{formatStat(hero.stats.assists)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;