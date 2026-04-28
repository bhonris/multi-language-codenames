import { io } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@signal/shared';

export const socket = io('/', {
  autoConnect: false,
  path: '/socket.io',
});
