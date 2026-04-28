import { randomBytes } from 'node:crypto';
import type { Language, GameState, Team } from '@signal/shared';
import { ROOM_CODE_CHARS, ROOM_CODE_LENGTH, ROOM_EXPIRY_MS } from '../config/constants.js';
import { getAllRooms, getRoom, setRoom, deleteRoom, type Room } from './roomStore.js';

function generateCode(): string {
  let code = '';
  const bytes = randomBytes(ROOM_CODE_LENGTH);
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_CHARS[bytes[i] % ROOM_CODE_CHARS.length];
  }
  return code;
}

function makeInitialGame(firstTeam: Team = 'red'): GameState {
  return {
    phase: 'lobby',
    activeTeam: null,
    guessesRemaining: null,
    currentClue: null,
    redRemaining: 9,
    blueRemaining: 8,
    winner: null,
    winReason: null,
    firstTeam,
  };
}

export function createRoom(language: Language, creatorId: string): Room {
  let code = generateCode();
  while (getRoom(code)) {
    code = generateCode();
  }
  const room: Room = {
    code,
    creatorId,
    language,
    players: new Map(),
    board: [],
    game: makeInitialGame(),
    chatHistory: [],
    lastActivityAt: Date.now(),
  };
  setRoom(code, room);
  return room;
}

export function touchRoom(code: string): void {
  const room = getRoom(code);
  if (room) room.lastActivityAt = Date.now();
}

export function startExpiry(): NodeJS.Timeout {
  return setInterval(() => {
    const now = Date.now();
    for (const [code, room] of getAllRooms()) {
      if (now - room.lastActivityAt > ROOM_EXPIRY_MS) {
        deleteRoom(code);
      }
    }
  }, 5 * 60 * 1000);
}

export { getRoom, deleteRoom };
