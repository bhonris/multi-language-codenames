import type { Server, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@signal/shared';
import { getRoom, touchRoom } from '../../rooms/roomManager.js';
import { CHAT_MAX_LENGTH } from '../../config/constants.js';
import { randomUUID } from 'node:crypto';

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type AppServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function registerChatHandlers(io: AppServer, socket: AppSocket): void {
  socket.on('chat:message', (text: string) => {
    const { roomCode, playerId } = socket.data;
    const room = getRoom(roomCode);
    if (!room || !playerId) return;
    const player = room.players.get(playerId);
    if (!player) return;
    const trimmed = text.slice(0, CHAT_MAX_LENGTH).trim();
    if (!trimmed) return;
    const msg = {
      id: randomUUID(),
      playerId,
      displayName: player.displayName,
      text: trimmed,
      timestamp: Date.now(),
    };
    room.chatHistory.push(msg);
    touchRoom(roomCode);
    io.to(roomCode).emit('chat:message', msg);
  });
}
