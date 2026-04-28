import { Server } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@signal/shared';
import { registerHandlers } from './handlers/index.js';

export function createSocketServer(httpServer: import('node:http').Server) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: '*' },
  });

  io.on('connection', socket => {
    registerHandlers(io, socket);
  });

  return io;
}
