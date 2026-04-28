import type { Team, GameStartState } from '../types/game.js';
import type { Player } from '../types/player.js';
import type { Card, CardColor, CardPublic } from '../types/card.js';
import type { ChatMessage } from '../types/chat.js';
import type { RoomSnapshot } from '../types/room.js';

export interface ServerToClientEvents {
  'room:state': (snapshot: RoomSnapshot) => void;
  'room:player-joined': (player: Player) => void;
  'room:player-left': (playerId: string) => void;
  'room:player-updated': (player: Player) => void;
  'room:language-changed': (language: import('../types/game.js').Language) => void;
  'game:started': (board: CardPublic[], state: GameStartState) => void;
  'game:handler-board': (board: Card[]) => void;
  'game:clue-submitted': (word: string, count: number, team: Team) => void;
  'game:card-revealed': (cardIndex: number, color: CardColor, word: string) => void;
  'game:turn-changed': (activeTeam: Team, guessesRemaining: number | null) => void;
  'game:over': (winner: Team, reason: 'cards-cleared' | 'traitor-hit') => void;
  'game:paused': (paused: boolean) => void;
  'chat:message': (msg: ChatMessage) => void;
  'error': (code: string, message: string) => void;
}
