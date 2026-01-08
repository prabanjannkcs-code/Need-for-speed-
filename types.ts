
export interface GameState {
  score: number;
  distance: number;
  speed: number;
  isGameOver: boolean;
  isPaused: boolean;
  highScore: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface GameObject {
  id: string;
  pos: Position;
  width: number;
  height: number;
  color: string;
  type: 'player' | 'enemy' | 'powerup';
  image?: string;
}

export interface CommentaryMessage {
  id: string;
  text: string;
  timestamp: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}
