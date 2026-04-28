import type { Server, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@signal/shared';
import { createRoom, getRoom, touchRoom } from '../../rooms/roomManager.js';
import { addPlayer, toPublicPlayer, setPlayerTeam, setPlayerRole } from '../../rooms/playerManager.js';
import { RECONNECT_GRACE_MS } from '../../config/constants.js';
import type { Language, Team, Role } from '@signal/shared';

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type AppServer = Server<ClientToServerEvents, ServerToClientEvents>;

function buildSnapshot(room: ReturnType<typeof getRoom>!, playerId: string, playerSecret: string) {
  return {
    code: room.code,
    language: room.language,
    players: [...room.players.values()].map(toPublicPlayer),
    game: room.game,
    board: room.board,
    chatHistory: room.chatHistory,
    isCreator: room.creatorId === playerId,
    myPlayerId: playerId,
    myPlayerSecret: playerSecret,
  };
}

function countConnected(room: ReturnType<typeof getRoom>!): number {
  return [...room.players.values()].filter(p => p.connected).length;
}

export function registerRoomHandlers(io: AppServer, socket: AppSocket): void {
  socket.on('player:join', ({ roomCode, displayName, playerSecret }) => {
    const room = getRoom(roomCode);
    if (!room) {
      socket.emit('error', 'ROOM_NOT_FOUND', 'Room not found');
      return;
    }

    // Reconnect path: if playerSecret matches an existing player, restore them
    if (playerSecret) {
      const existing = [...room.players.values()].find(p => p.secret === playerSecret);
      if (existing) {
        if (existing.disconnectTimer) {
          clearTimeout(existing.disconnectTimer);
          existing.disconnectTimer = null;
        }
        existing.socketId = socket.id;
        existing.connected = true;
        socket.data.playerId = existing.id;
        socket.data.roomCode = roomCode;
        socket.join(roomCode);
        touchRoom(roomCode);
        socket.emit('room:state', buildSnapshot(room, existing.id, existing.secret));
        io.to(roomCode).emit('room:player-updated', toPublicPlayer(existing));
        // Resume game if enough players reconnected
        if (room.game.phase === 'playing' && countConnected(room) >= 2) {
          io.to(roomCode).emit('game:paused', false);
        }
        return;
      }
    }

    if (!displayName || displayName.trim().length < 2 || displayName.trim().length > 20) {
      socket.emit('error', 'INVALID_NAME', 'Display name must be 2–20 characters');
      return;
    }
    const player = addPlayer(room, displayName.trim(), socket.id);
    socket.data.playerId = player.id;
    socket.data.roomCode = roomCode;
    if (room.players.size === 1) room.creatorId = player.id;
    socket.join(roomCode);
    touchRoom(roomCode);
    socket.emit('room:state', buildSnapshot(room, player.id, player.secret));
    socket.to(roomCode).emit('room:player-joined', toPublicPlayer(player));
    if (room.game.phase === 'playing' && countConnected(room) >= 2) {
      io.to(roomCode).emit('game:paused', false);
    }
  });

  socket.on('player:set-team', (team: Team) => {
    const { roomCode, playerId } = socket.data;
    const room = getRoom(roomCode);
    if (!room || !playerId) return;
    const player = room.players.get(playerId);
    if (!player) return;
    setPlayerTeam(player, team);
    touchRoom(roomCode);
    io.to(roomCode).emit('room:player-updated', toPublicPlayer(player));
  });

  socket.on('player:set-role', (role: Role) => {
    const { roomCode, playerId } = socket.data;
    const room = getRoom(roomCode);
    if (!room || !playerId) return;
    const player = room.players.get(playerId);
    if (!player || !player.team) {
      socket.emit('error', 'NO_TEAM', 'Join a team first');
      return;
    }
    const result = setPlayerRole(player, role, room);
    if (!result.success) {
      socket.emit('error', result.reason!, 'Role unavailable');
      return;
    }
    touchRoom(roomCode);
    io.to(roomCode).emit('room:player-updated', toPublicPlayer(player));
  });

  socket.on('room:set-language', (language: Language) => {
    const { roomCode, playerId } = socket.data;
    const room = getRoom(roomCode);
    if (!room || !playerId) return;
    if (room.creatorId !== playerId) return;
    if (room.game.phase !== 'lobby') return;
    room.language = language;
    touchRoom(roomCode);
    io.to(roomCode).emit('room:language-changed', language);
  });

  socket.on('disconnect', () => {
    const { roomCode, playerId } = socket.data;
    if (!roomCode || !playerId) return;
    const room = getRoom(roomCode);
    if (!room) return;
    const player = room.players.get(playerId);
    if (!player) return;

    player.connected = false;
    player.socketId = null;
    io.to(roomCode).emit('room:player-left', playerId);

    if (room.game.phase === 'playing' && countConnected(room) < 2) {
      io.to(roomCode).emit('game:paused', true);
    }

    // Remove player from room after grace period if they don't reconnect
    player.disconnectTimer = setTimeout(() => {
      const r = getRoom(roomCode);
      if (!r) return;
      const p = r.players.get(playerId);
      if (p && !p.connected) {
        r.players.delete(playerId);
      }
    }, RECONNECT_GRACE_MS);
  });
}
