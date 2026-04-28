import type { Server, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents } from '@signal/shared';
import { registerRoomHandlers } from './roomHandlers.js';
import { registerGameHandlers } from './gameHandlers.js';
import { registerChatHandlers } from './chatHandlers.js';

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type AppServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function registerHandlers(io: AppServer, socket: AppSocket): void {
  registerRoomHandlers(io, socket);
  registerGameHandlers(io, socket);
  registerChatHandlers(io, socket);
}
