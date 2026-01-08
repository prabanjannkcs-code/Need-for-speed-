
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CAR_WIDTH, CAR_HEIGHT, LANE_WIDTH, INITIAL_SPEED, SPEED_INCREMENT, MAX_SPEED, NEON_COLORS } from '../constants';
import { GameState, GameObject, CommentaryMessage, Position } from '../types';
import { getGameCommentary } from '../services/geminiService';
import HUD from './HUD';

interface GameManagerProps {
  playerSkin: string | null;
  onGameOver: (score: number) => void;
}

const GameManager: React.FC<GameManagerProps> = ({ playerSkin, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    distance: 0,
    speed: INITIAL_SPEED,
    isGameOver: false,
    isPaused: false,
    highScore: 0,
  });
  const [commentary, setCommentary] = useState<CommentaryMessage[]>([]);

  // Internal refs for fast game loop access without re-renders
  const stateRef = useRef(gameState);
  const playerPosRef = useRef<Position>({ x: CANVAS_WIDTH / 2 - CAR_WIDTH / 2, y: CANVAS_HEIGHT - 120 });
  const enemiesRef = useRef<GameObject[]>([]);
  const roadOffsetRef = useRef(0);
  const lastCommentaryTime = useRef(0);
  const imagesRef = useRef<{ [key: string]: HTMLImageElement }>({});

  // Sync state ref
  useEffect(() => { stateRef.current = gameState; }, [gameState]);

  const addCommentary = useCallback(async (event: string) => {
    const now = Date.now();
    if (now - lastCommentaryTime.current < 5000) return; // Rate limit 5s
    
    lastCommentaryTime.current = now;
    const result = await getGameCommentary(event, stateRef.current.score);
    if (result) {
      setCommentary(prev => [...prev, {
        id: Math.random().toString(36),
        text: result.text,
        timestamp: Date.now(),
        sentiment: result.sentiment
      }].slice(-10));
    }
  }, []);

  const spawnEnemy = useCallback(() => {
    const lane = Math.floor(Math.random() * 3);
    const x = lane * LANE_WIDTH + (LANE_WIDTH / 2) - (CAR_WIDTH / 2);
    const newEnemy: GameObject = {
      id: Math.random().toString(36),
      pos: { x, y: -CAR_HEIGHT },
      width: CAR_WIDTH,
      height: CAR_HEIGHT,
      color: NEON_COLORS.enemy,
      type: 'enemy'
    };
    enemiesRef.current.push(newEnemy);
  }, []);

  const resetGame = () => {
    setGameState({
      score: 0,
      distance: 0,
      speed: INITIAL_SPEED,
      isGameOver: false,
      isPaused: false,
      highScore: Math.max(gameState.highScore, gameState.score)
    });
    playerPosRef.current = { x: CANVAS_WIDTH / 2 - CAR_WIDTH / 2, y: CANVAS_HEIGHT - 120 };
    enemiesRef.current = [];
    roadOffsetRef.current = 0;
    setCommentary([]);
    addCommentary("Game Start! Put the pedal to the metal!");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.isGameOver) return;
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        playerPosRef.current.x = Math.max(10, playerPosRef.current.x - LANE_WIDTH);
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        playerPosRef.current.x = Math.min(CANVAS_WIDTH - CAR_WIDTH - 10, playerPosRef.current.x + LANE_WIDTH);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.isGameOver]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      if (stateRef.current.isGameOver || stateRef.current.isPaused) return;

      // Update Phase
      const currentSpeed = stateRef.current.speed;
      roadOffsetRef.current = (roadOffsetRef.current + currentSpeed) % 80;
      
      // Update score and distance
      setGameState(prev => ({
        ...prev,
        distance: prev.distance + (currentSpeed / 10),
        score: prev.score + (currentSpeed > 10 ? 2 : 1),
        speed: Math.min(MAX_SPEED, prev.speed + SPEED_INCREMENT)
      }));

      // Enemy Management
      if (Math.random() < 0.02) spawnEnemy();
      
      enemiesRef.current = enemiesRef.current.filter(enemy => {
        enemy.pos.y += currentSpeed + 2; // Enemies move slower relative to road or faster if heading towards player?
        
        // Collision detection
        const p = playerPosRef.current;
        if (
          p.x < enemy.pos.x + enemy.width &&
          p.x + CAR_WIDTH > enemy.pos.x &&
          p.y < enemy.pos.y + enemy.height &&
          p.y + CAR_HEIGHT > enemy.pos.y
        ) {
          setGameState(prev => ({ ...prev, isGameOver: true }));
          addCommentary("Massive crash! That's gotta hurt.");
          onGameOver(stateRef.current.score);
          return false;
        }

        return enemy.pos.y < CANVAS_HEIGHT + 100;
      });

      // Commentary Triggers
      if (stateRef.current.score % 500 === 0 && stateRef.current.score > 0) {
        addCommentary("You're on fire! Keep it up.");
      }

      // Draw Phase
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 1. Draw Road
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // 2. Road markings
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 4;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * LANE_WIDTH, 0);
        ctx.lineTo(i * LANE_WIDTH, CANVAS_HEIGHT);
        ctx.stroke();
      }

      // Lane dashed lines
      ctx.strokeStyle = '#555';
      ctx.setLineDash([40, 40]);
      ctx.lineDashOffset = -roadOffsetRef.current;
      for (let i = 1; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(i * LANE_WIDTH, -80);
        ctx.lineTo(i * LANE_WIDTH, CANVAS_HEIGHT + 80);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // 3. Draw Player
      const p = playerPosRef.current;
      if (playerSkin) {
        if (!imagesRef.current[playerSkin]) {
          const img = new Image();
          img.src = playerSkin;
          img.onload = () => { imagesRef.current[playerSkin] = img; };
        }
        if (imagesRef.current[playerSkin]) {
          ctx.drawImage(imagesRef.current[playerSkin], p.x, p.y, CAR_WIDTH, CAR_HEIGHT);
        } else {
          // Fallback
          ctx.fillStyle = NEON_COLORS.player;
          ctx.shadowBlur = 15;
          ctx.shadowColor = NEON_COLORS.player;
          ctx.fillRect(p.x, p.y, CAR_WIDTH, CAR_HEIGHT);
        }
      } else {
        ctx.fillStyle = NEON_COLORS.player;
        ctx.shadowBlur = 15;
        ctx.shadowColor = NEON_COLORS.player;
        ctx.fillRect(p.x, p.y, CAR_WIDTH, CAR_HEIGHT);
      }
      ctx.shadowBlur = 0;

      // 4. Draw Enemies
      enemiesRef.current.forEach(enemy => {
        ctx.fillStyle = NEON_COLORS.enemy;
        ctx.shadowBlur = 10;
        ctx.shadowColor = NEON_COLORS.enemy;
        ctx.fillRect(enemy.pos.x, enemy.pos.y, enemy.width, enemy.height);
        
        // Simple detailing for enemy car
        ctx.fillStyle = 'black';
        ctx.fillRect(enemy.pos.x + 5, enemy.pos.y + 10, 10, 20); // Windshield
        ctx.fillRect(enemy.pos.x + 35, enemy.pos.y + 10, 10, 20);
      });
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState.isGameOver, gameState.isPaused, playerSkin, spawnEnemy, addCommentary, onGameOver]);

  return (
    <div className="relative w-full max-w-[400px] h-[600px] bg-black shadow-2xl shadow-cyan-500/20 overflow-hidden rounded-xl border border-gray-800">
      <canvas 
        ref={canvasRef} 
        width={CANVAS_WIDTH} 
        height={CANVAS_HEIGHT}
        className="block"
      />
      
      <HUD gameState={gameState} commentary={commentary} />

      {gameState.isGameOver && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-5xl font-orbitron font-black text-red-500 mb-2 italic">WASTED</h2>
          <p className="text-xl text-gray-400 mb-8 font-orbitron">Final Score: {gameState.score}</p>
          <button 
            onClick={resetGame}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-black py-4 px-10 rounded-full transition-all transform hover:scale-105 active:scale-95 font-orbitron"
          >
            REBOOT SYSTEM
          </button>
        </div>
      )}

      {/* Mobile Controls */}
      <div className="absolute bottom-10 inset-x-0 flex justify-between px-10 pointer-events-none md:hidden">
        <button 
          onPointerDown={() => playerPosRef.current.x = Math.max(10, playerPosRef.current.x - LANE_WIDTH)}
          className="w-20 h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-4xl pointer-events-auto active:bg-cyan-500/50"
        >
          ⬅️
        </button>
        <button 
          onPointerDown={() => playerPosRef.current.x = Math.min(CANVAS_WIDTH - CAR_WIDTH - 10, playerPosRef.current.x + LANE_WIDTH)}
          className="w-20 h-20 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-4xl pointer-events-auto active:bg-cyan-500/50"
        >
          ➡️
        </button>
      </div>
    </div>
  );
};

export default GameManager;
