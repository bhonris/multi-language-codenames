import type { Team, Role, Language } from '../types/game.js';

export interface ClientToServerEvents {
  'player:join': (payload: { roomCode: string; displayName: string; playerId?: string; playerSecret?: string }) => void;
  'player:set-team': (team: Team) => void;
  'player:set-role': (role: Role) => void;
  'room:set-language': (language: Language) => void;
  'game:start': () => void;
  'game:submit-clue': (word: string, count: number) => void;
  'game:guess': (cardIndex: number) => void;
  'game:pass': () => void;
  'game:rematch': () => void;
  'chat:message': (text: string) => void;
}
