
import React, { useState } from 'react';
import GameManager from './components/GameManager';
import { generateCarSkin } from './services/geminiService';

const App: React.FC = () => {
  const [gameView, setGameView] = useState<'start' | 'playing' | 'customizing'>('start');
  const [playerSkin, setPlayerSkin] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastScore, setLastScore] = useState(0);

  const handleGenerate = async () => {
    if (!customPrompt.trim()) return;
    setIsGenerating(true);
    const skinUrl = await generateCarSkin(customPrompt);
    if (skinUrl) {
      setPlayerSkin(skinUrl);
      setGameView('playing');
    }
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=2070')] bg-cover bg-fixed">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm -z-10" />

      {gameView === 'start' && (
        <div className="max-w-md w-full bg-black/60 border border-cyan-500/30 p-8 rounded-3xl backdrop-blur-xl text-center space-y-8 shadow-[0_0_50px_rgba(6,182,212,0.1)]">
          <div>
            <h1 className="text-6xl font-orbitron font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              NEON RACER
            </h1>
            <p className="text-gray-400 font-medium tracking-widest uppercase mt-2">Enhanced by Gemini AI</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={() => setGameView('playing')}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-4 px-6 rounded-xl text-xl shadow-lg shadow-cyan-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] font-orbitron"
            >
              QUICK RACE
            </button>
            
            <button 
              onClick={() => setGameView('customizing')}
              className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 px-6 rounded-xl text-xl border border-white/10 transition-all hover:border-cyan-500/50 font-orbitron"
            >
              AI CUSTOMIZE
            </button>
          </div>

          {lastScore > 0 && (
            <div className="pt-4 border-t border-white/5">
              <p className="text-gray-500 text-sm uppercase font-bold tracking-widest mb-1">Last Session</p>
              <p className="text-3xl font-orbitron text-cyan-400">{lastScore}</p>
            </div>
          )}

          <div className="text-xs text-gray-500 uppercase tracking-widest font-bold">
            Use <span className="text-white px-1 border border-white/20 rounded">A / D</span> or <span className="text-white px-1 border border-white/20 rounded">Arrows</span> to drive
          </div>
        </div>
      )}

      {gameView === 'customizing' && (
        <div className="max-w-md w-full bg-black/60 border border-purple-500/30 p-8 rounded-3xl backdrop-blur-xl space-y-6 shadow-[0_0_50px_rgba(168,85,247,0.1)]">
          <div className="text-center">
            <h2 className="text-3xl font-orbitron font-black text-purple-400">CAR DESIGNER</h2>
            <p className="text-gray-400 text-sm">Describe your dream machine to the AI</p>
          </div>

          <textarea 
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g. A sleek obsidian hypercar with glowing magenta circuits and a massive spoiler..."
            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500 min-h-[120px]"
          />

          <div className="flex flex-col gap-3">
            <button 
              onClick={handleGenerate}
              disabled={isGenerating || !customPrompt.trim()}
              className="w-full bg-purple-500 hover:bg-purple-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all font-orbitron flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  FORGING CHASSIS...
                </>
              ) : 'GENERATE SKIN'}
            </button>
            <button 
              onClick={() => setGameView('start')}
              className="w-full text-gray-400 hover:text-white py-2 transition-all font-orbitron text-xs uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {gameView === 'playing' && (
        <div className="flex flex-col items-center gap-4 animate-scale-in">
          <GameManager 
            playerSkin={playerSkin} 
            onGameOver={(score) => {
              setLastScore(score);
            }} 
          />
          <button 
            onClick={() => setGameView('start')}
            className="text-white/40 hover:text-white/80 uppercase text-xs tracking-[0.3em] font-black transition-all"
          >
            EXIT TO MAIN MENU
          </button>
        </div>
      )}

      <footer className="fixed bottom-4 left-0 right-0 text-center pointer-events-none opacity-30 text-[10px] uppercase tracking-[0.5em] font-bold">
        Powered by Google Gemini 2.5
      </footer>
    </div>
  );
};

export default App;
