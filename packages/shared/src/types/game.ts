import type { CardColor } from './card.js';

export type Team = 'red' | 'blue';
export type Role = 'handler' | 'operative';
export type GamePhase = 'lobby' | 'playing' | 'ended';
export type Language = 'en' | 'th' | 'mixed';

export interface GameStartState {
  redRemaining: number;
  blueRemaining: number;
  firstTeam: Team;
}

export interface ClueRecord {
  word: string;
  count: number;
  team: Team;
}

export interface GameState {
  phase: GamePhase;
  activeTeam: Team | null;
  guessesRemaining: number | null;
  currentClue: ClueRecord | null;
  redRemaining: number;
  blueRemaining: number;
  winner: Team | null;
  winReason: 'cards-cleared' | 'traitor-hit' | null;
  firstTeam: Team;
}
