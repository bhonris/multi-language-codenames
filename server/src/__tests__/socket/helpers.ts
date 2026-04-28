import { createServer } from 'node:http';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import { createApp } from '../../app.js';
import { createSocketServer } from '../../socket/socketServer.js';
import type { ServerToClientEvents, ClientToServerEvents } from '@signal/shared';

export type TestClient = ClientSocket<ServerToClientEvents, ClientToServerEvents>;

export function createTestServer(): Promise<{ port: number; cleanup: () => Promise<void> }> {
  return new Promise((resolve) => {
    const app = createApp();
    const httpServer = createServer(app);
    createSocketServer(httpServer);
    httpServer.listen(0, () => {
      const addr = httpServer.address() as { port: number };
      resolve({
        port: addr.port,
        cleanup: () => new Promise(res => httpServer.close(() => res())),
      });
    });
  });
}

export function connectClient(port: number): TestClient {
  return ioClient(`http://localhost:${port}`, { autoConnect: false }) as TestClient;
}

export function waitFor<T>(socket: TestClient, event: string): Promise<T> {
  return new Promise((resolve) => {
    socket.once(event as any, (...args: any[]) => resolve(args.length === 1 ? args[0] : args as any));
  });
}
