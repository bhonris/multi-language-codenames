import { describe, it, expect, beforeEach } from 'vitest';
import { addPlayer, getHandlerCount, canSetHandler, setPlayerTeam, setPlayerRole, toPublicPlayer } from '../../rooms/playerManager.js';
import { createRoom } from '../../rooms/roomManager.js';
import { clearAllRooms } from '../../rooms/roomStore.js';

describe('playerManager', () => {
  beforeEach(() => clearAllRooms());

  it('adds a player with correct defaults', () => {
    const room = createRoom('en', 'creator');
    const player = addPlayer(room, 'Alice', 'socket-1');
    expect(player.displayName).toBe('Alice');
    expect(player.role).toBe('operative');
    expect(player.team).toBeNull();
    expect(player.connected).toBe(true);
    expect(player.socketId).toBe('socket-1');
    expect(room.players.has(player.id)).toBe(true);
  });

  it('getHandlerCount returns 0 when no handlers', () => {
    const room = createRoom('en', 'creator');
    addPlayer(room, 'Alice', 'socket-1');
    expect(getHandlerCount(room, 'red')).toBe(0);
  });

  it('getHandlerCount counts connected handlers only', () => {
    const room = createRoom('en', 'creator');
    const p = addPlayer(room, 'Alice', 'socket-1');
    p.team = 'red';
    p.role = 'handler';
    expect(getHandlerCount(room, 'red')).toBe(1);
    p.connected = false;
    expect(getHandlerCount(room, 'red')).toBe(0);
  });

  it('canSetHandler is true when no handler on team', () => {
    const room = createRoom('en', 'creator');
    const p = addPlayer(room, 'Alice', 'socket-1');
    p.team = 'red';
    expect(canSetHandler(room, 'red')).toBe(true);
  });

  it('canSetHandler is false when handler already assigned', () => {
    const room = createRoom('en', 'creator');
    const p1 = addPlayer(room, 'Alice', 'socket-1');
    const p2 = addPlayer(room, 'Bob', 'socket-2');
    p1.team = 'red'; p1.role = 'handler';
    p2.team = 'red';
    expect(canSetHandler(room, 'red', p2.id)).toBe(false);
  });

  it('canSetHandler excludes the player themselves', () => {
    const room = createRoom('en', 'creator');
    const p = addPlayer(room, 'Alice', 'socket-1');
    p.team = 'red'; p.role = 'handler';
    expect(canSetHandler(room, 'red', p.id)).toBe(true);
  });

  it('setPlayerTeam assigns team', () => {
    const room = createRoom('en', 'creator');
    const p = addPlayer(room, 'Alice', 'socket-1');
    setPlayerTeam(p, 'blue');
    expect(p.team).toBe('blue');
  });

  it('setPlayerRole succeeds for operative', () => {
    const room = createRoom('en', 'creator');
    const p = addPlayer(room, 'Alice', 'socket-1');
    p.team = 'red';
    const result = setPlayerRole(p, 'operative', room);
    expect(result.success).toBe(true);
    expect(p.role).toBe('operative');
  });

  it('setPlayerRole rejects duplicate handler', () => {
    const room = createRoom('en', 'creator');
    const p1 = addPlayer(room, 'Alice', 'socket-1');
    const p2 = addPlayer(room, 'Bob', 'socket-2');
    p1.team = 'red'; p1.role = 'handler';
    p2.team = 'red';
    const result = setPlayerRole(p2, 'handler', room);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('HANDLER_ALREADY_TAKEN');
  });

  it('toPublicPlayer strips secret and socketId', () => {
    const room = createRoom('en', 'creator');
    const p = addPlayer(room, 'Alice', 'socket-1');
    const pub = toPublicPlayer(p);
    expect('secret' in pub).toBe(false);
    expect('socketId' in pub).toBe(false);
    expect(pub.displayName).toBe('Alice');
  });
});
