import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { clearAllRooms } from '../rooms/roomStore.js';

const app = createApp();

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('POST /api/rooms', () => {
  beforeEach(() => clearAllRooms());

  it('creates a room with valid body', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .send({ displayName: 'Alice', language: 'en' });
    expect(res.status).toBe(201);
    expect(res.body.roomCode).toMatch(/^[A-Z0-9]{6}$/);
    expect(res.body.playerId).toBeTruthy();
  });

  it('rejects short display name', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .send({ displayName: 'A', language: 'en' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_DISPLAY_NAME');
  });

  it('rejects missing display name', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .send({ language: 'en' });
    expect(res.status).toBe(400);
  });

  it('rejects invalid language', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .send({ displayName: 'Alice', language: 'fr' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_LANGUAGE');
  });

  it('accepts mixed language', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .send({ displayName: 'Bob', language: 'mixed' });
    expect(res.status).toBe(201);
  });

  it('accepts thai language', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .send({ displayName: 'Charlie', language: 'th' });
    expect(res.status).toBe(201);
  });
});

describe('GET /api/rooms/:code', () => {
  beforeEach(() => clearAllRooms());

  it('returns 404 for unknown room', async () => {
    const res = await request(app).get('/api/rooms/XXXXXX');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('ROOM_NOT_FOUND');
  });

  it('returns room info for existing room', async () => {
    const createRes = await request(app)
      .post('/api/rooms')
      .send({ displayName: 'Alice', language: 'mixed' });
    const { roomCode } = createRes.body;
    const res = await request(app).get(`/api/rooms/${roomCode}`);
    expect(res.status).toBe(200);
    expect(res.body.roomCode).toBe(roomCode);
    expect(res.body.language).toBe('mixed');
    expect(res.body.gamePhase).toBe('lobby');
  });
});
