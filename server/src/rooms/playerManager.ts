import { randomUUID } from 'node:crypto';
import type { Team, Role } from '@signal/shared';
import type { Room, PlayerRecord } from './roomStore.js';

export function addPlayer(room: Room, displayName: string, socketId: string): PlayerRecord {
  const player: PlayerRecord = {
    id: randomUUID(),
    secret: randomUUID(),
    displayName,
    team: null,
    role: 'operative',
    connected: true,
    socketId,
    disconnectTimer: null,
  };
  room.players.set(player.id, player);
  return player;
}

export function getHandlerCount(room: Room, team: Team): number {
  return [...room.players.values()].filter(p => p.team === team && p.role === 'handler' && p.connected).length;
}

export function canSetHandler(room: Room, team: Team, excludePlayerId?: string): boolean {
  return ![...room.players.values()].some(p => p.team === team && p.role === 'handler' && p.id !== excludePlayerId);
}

export function setPlayerTeam(player: PlayerRecord, team: Team): void {
  player.team = team;
}

export function setPlayerRole(player: PlayerRecord, role: Role, room: Room): { success: boolean; reason?: string } {
  if (role === 'handler' && !canSetHandler(room, player.team!, player.id)) {
    return { success: false, reason: 'HANDLER_ALREADY_TAKEN' };
  }
  player.role = role;
  return { success: true };
}

export function toPublicPlayer(p: PlayerRecord) {
  return {
    id: p.id,
    displayName: p.displayName,
    team: p.team,
    role: p.role,
    connected: p.connected,
  };
}
