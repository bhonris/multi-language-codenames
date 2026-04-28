import type { Server, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@signal/shared';
import { createRoom, getRoom, touchRoom } from '../../rooms/roomManager.js';
import { addPlayer, toPublicPlayer, setPlayerTeam, setPlayerRole } from '../../rooms/playerManager.js';
import type { Language, Team, Role } from '@signal/shared';

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type AppServer = Server<ClientToServerEvents, ServerToClientEvents>;

function buildSnapshot(room: ReturnType<typeof getRoom>!, playerId: string) {
  return {
    code: room.code,
    language: room.language,
    players: [...room.players.values()].map(toPublicPlayer),
    game: room.game,
    board: room.board,
    chatHistory: room.chatHistory,
    isCreator: room.creatorId === playerId,
    myPlayerId: playerId,
  };
}

export function registerRoomHandlers(io: AppServer, socket: AppSocket): void {
  socket.on('player:join', ({ roomCode, displayName }) => {
    const room = getRoom(roomCode);
    if (!room) {
      socket.emit('error', 'ROOM_NOT_FOUND', 'Room not found');
      return;
    }
    if (!displayName || displayName.trim().length < 2 || displayName.trim().length > 20) {
      socket.emit('error', 'INVALID_NAME', 'Display name must be 2–20 characters');
      return;
    }
    const player = addPlayer(room, displayName.trim(), socket.id);
    socket.data.playerId = player.id;
    socket.data.roomCode = roomCode;
    // First player to join becomes the room creator
    if (room.players.size === 1) room.creatorId = player.id;
    socket.join(roomCode);
    touchRoom(roomCode);
    socket.emit('room:state', buildSnapshot(room, player.id));
    socket.to(roomCode).emit('room:player-joined', toPublicPlayer(player));
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

  socket.on('disconnect', () => {
    const { roomCode, playerId } = socket.data;
    if (!roomCode || !playerId) return;
    const room = getRoom(roomCode);
    if (!room) return;
    const player = room.players.get(playerId);
    if (player) {
      player.connected = false;
      player.socketId = null;
      io.to(roomCode).emit('room:player-left', playerId);
    }
  });
}
