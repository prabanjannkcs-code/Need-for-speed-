
import React from 'react';
import { GameState, CommentaryMessage } from '../types';

interface HUDProps {
  gameState: GameState;
  commentary: CommentaryMessage[];
}

const HUD: React.FC<HUDProps> = ({ gameState, commentary }) => {
  return (
    <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
      {/* Top Bar: Stats */}
      <div className="flex justify-between items-start">
        <div className="bg-black/60 border-l-4 border-cyan-400 p-3 backdrop-blur-md">
          <div className="text-xs text-cyan-400 font-bold tracking-widest uppercase">Distance</div>
          <div className="text-2xl font-orbitron font-black">{Math.floor(gameState.distance)}m</div>
        </div>
        
        <div className="bg-black/60 border-r-4 border-magenta-400 p-3 backdrop-blur-md text-right">
          <div className="text-xs text-pink-500 font-bold tracking-widest uppercase">Score</div>
          <div className="text-2xl font-orbitron font-black text-pink-500">{gameState.score}</div>
        </div>
      </div>

      {/* Speedometer (Bottom Left) */}
      <div className="flex flex-col gap-2">
        <div className="bg-black/60 p-3 backdrop-blur-md w-32 border-b-2 border-yellow-500">
           <div className="text-xs text-yellow-500 font-bold uppercase">Warp Drive</div>
           <div className="text-xl font-orbitron">{(gameState.speed * 10).toFixed(1)} <span className="text-xs">U/s</span></div>
           <div className="w-full bg-gray-800 h-1 mt-1">
             <div 
               className="h-full bg-yellow-500 transition-all duration-300" 
               style={{ width: `${(gameState.speed / 15) * 100}%` }}
             ></div>
           </div>
        </div>

        {/* AI Commentary Log (Bottom Right area) */}
        <div className="self-end max-w-xs space-y-2 overflow-hidden flex flex-col items-end">
          {commentary.slice(-3).map((msg, idx) => (
            <div 
              key={msg.id} 
              className={`bg-black/80 p-3 rounded-lg border-l-4 text-sm font-medium transition-all animate-fade-in
                ${msg.sentiment === 'positive' ? 'border-green-500' : 
                  msg.sentiment === 'negative' ? 'border-red-500' : 'border-blue-500'}`}
              style={{ opacity: 1 - (2 - idx) * 0.3 }}
            >
              {msg.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HUD;
