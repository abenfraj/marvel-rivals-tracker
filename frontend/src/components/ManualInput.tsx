import React, { useState } from 'react';
import { Users, Send } from 'lucide-react';

const MARVEL_CHARACTERS = [
  "Iron Man", "Spider-Man", "Doctor Strange", "Thor", "Black Panther", 
  "Captain America", "Black Widow", "Hulk", "Scarlet Witch", "Loki",
  "Wolverine", "Storm", "Magneto", "Phoenix", "Deadpool"
];

interface ManualInputProps {
  onSubmit: (players: Array<{ playerName: string, characters: string[] }>) => void;
}

const ManualInput: React.FC<ManualInputProps> = ({ onSubmit }) => {
  const [players, setPlayers] = useState(Array(5).fill(null).map(() => ({
    playerName: '',
    characters: []
  })));

  const handlePlayerChange = (index: number, value: string) => {
    const newPlayers = [...players];
    newPlayers[index] = {
      ...newPlayers[index],
      playerName: value,
      characters: [...MARVEL_CHARACTERS].sort(() => 0.5 - Math.random()).slice(0, 3)
    };
    setPlayers(newPlayers);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validPlayers = players.filter(p => p.playerName);
    if (validPlayers.length > 0) {
      onSubmit(validPlayers);
    }
  };

  return (
    <div className="bg-black/20 backdrop-blur-sm rounded-lg border-2 border-red-500/20 p-6">
      <div className="flex items-center justify-center mb-6">
        <Users className="w-8 h-8 text-red-500 mr-3" />
        <h3 className="text-xl font-semibold text-white">Manual Player Entry</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {players.map((player, index) => (
            <div key={index} className="bg-black/40 p-4 rounded-lg border border-red-500/10">
              <input
                type="text"
                placeholder={`Player ${index + 1} Name`}
                value={player.playerName}
                onChange={(e) => handlePlayerChange(index, e.target.value)}
                className="w-full bg-gray-900/50 border border-red-500/20 rounded px-3 py-2 text-white focus:outline-none focus:border-red-500/50"
              />
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            type="submit"
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-3 rounded-full hover:from-red-500 hover:to-red-600 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 inline-flex items-center"
          >
            <Send className="w-5 h-5 mr-2" />
            Submit Players
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManualInput;