import { createServer } from 'node:http';
import { networkInterfaces } from 'node:os';
import { createApp } from './app.js';
import { createSocketServer } from './socket/socketServer.js';
import { startExpiry } from './rooms/roomManager.js';

const PORT = Number(process.env.PORT ?? 3001);

const app = createApp();
const httpServer = createServer(app);
createSocketServer(httpServer);
startExpiry();

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Signal server running on port ${PORT}`);
  const nets = networkInterfaces();
  for (const iface of Object.values(nets)) {
    for (const addr of iface ?? []) {
      if (addr.family === 'IPv4' && !addr.internal) {
        console.log(`  LAN: http://${addr.address}:${PORT}`);
      }
    }
  }
});
