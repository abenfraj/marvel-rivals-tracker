import React from 'react';
import { User, Star } from 'lucide-react';

interface Hero {
  name: string;
  imageUrl: string;
}

interface PlayerCardProps {
  player: {
    playerName: string;
    heroes: Hero[];
  };
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player }) => {
  if (!player || !player.heroes) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black p-1 rounded-lg transform hover:scale-105 transition-all duration-300">
      <div className="bg-black/80 backdrop-blur-lg p-6 rounded-lg border border-red-900/20">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-2 bg-red-500/10 rounded-full">
            <User className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-white">
            {player.playerName || 'Unknown Player'}
          </h3>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-400 flex items-center">
            <Star className="w-4 h-4 mr-2 text-yellow-500" />
            Most Played Characters
          </h4>
          <div className="space-y-2">
            {Array.isArray(player.heroes) && player.heroes.map((hero, index) => (
              <div 
                key={`${hero.name}-${index}`}
                className="bg-gradient-to-r from-red-900/20 to-transparent p-2 rounded flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  {hero.imageUrl && (
                    <img 
                      src={hero.imageUrl} 
                      alt={hero.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <span className="text-white">{hero.name}</span>
                </div>
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;