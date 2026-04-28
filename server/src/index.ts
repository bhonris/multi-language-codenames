import { createServer } from 'node:http';
import { createApp } from './app.js';
import { createSocketServer } from './socket/socketServer.js';
import { startExpiry } from './rooms/roomManager.js';

const PORT = process.env.PORT ?? 3001;

const app = createApp();
const httpServer = createServer(app);
createSocketServer(httpServer);
startExpiry();

httpServer.listen(PORT, () => {
  console.log(`Signal server running on port ${PORT}`);
});
