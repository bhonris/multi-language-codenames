import type { Language, GameState } from './game.js';
import type { Player } from './player.js';
import type { Card } from './card.js';
import type { ChatMessage } from './chat.js';

export interface RoomConfig {
  displayName: string;
  language: Language;
}

export interface RoomPublic {
  code: string;
  language: Language;
  playerCount: number;
  gamePhase: 'lobby' | 'playing' | 'ended';
}

export interface RoomSnapshot {
  code: string;
  language: Language;
  players: Player[];
  game: GameState;
  board: Card[];
  chatHistory: ChatMessage[];
  isCreator: boolean;
  myPlayerId: string;
  myPlayerSecret: string;
}
