import type { Language, GameState, Team } from '@signal/shared';
import type { Card } from '@signal/shared';
import type { ChatMessage } from '@signal/shared';

export interface PlayerRecord {
  id: string;
  secret: string;
  displayName: string;
  team: Team | null;
  role: 'handler' | 'operative';
  connected: boolean;
  socketId: string | null;
}

export interface Room {
  code: string;
  creatorId: string;
  language: Language;
  players: Map<string, PlayerRecord>;
  board: Card[];
  game: GameState;
  chatHistory: ChatMessage[];
  lastActivityAt: number;
}

const rooms = new Map<string, Room>();

export function getAllRooms(): Map<string, Room> {
  return rooms;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code);
}

export function setRoom(code: string, room: Room): void {
  rooms.set(code, room);
}

export function deleteRoom(code: string): void {
  rooms.delete(code);
}

export function clearAllRooms(): void {
  rooms.clear();
}
