import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getRoom, createRoom } from './rooms/roomManager.js';
import { randomUUID } from 'node:crypto';
import type { Language } from '@signal/shared';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/rooms', (req, res) => {
    const { displayName, language } = req.body as { displayName?: string; language?: string };
    if (!displayName || displayName.trim().length < 2 || displayName.trim().length > 20) {
      res.status(400).json({ error: 'INVALID_DISPLAY_NAME' });
      return;
    }
    if (!language || !['en', 'th', 'mixed'].includes(language)) {
      res.status(400).json({ error: 'INVALID_LANGUAGE' });
      return;
    }
    const creatorId = randomUUID();
    const room = createRoom(language as Language, creatorId);
    res.status(201).json({ roomCode: room.code, playerId: creatorId });
  });

  app.get('/api/rooms/:code', (req, res) => {
    const room = getRoom(req.params.code.toUpperCase());
    if (!room) {
      res.status(404).json({ error: 'ROOM_NOT_FOUND' });
      return;
    }
    res.json({
      roomCode: room.code,
      language: room.language,
      playerCount: [...room.players.values()].filter(p => p.connected).length,
      gamePhase: room.game.phase,
    });
  });

  // Serve built client for production/LAN single-port deploy
  const clientDist = join(dirname(fileURLToPath(import.meta.url)), '../../client/dist');
  if (existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => res.sendFile(join(clientDist, 'index.html')));
  }

  return app;
}
