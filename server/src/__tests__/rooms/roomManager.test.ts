import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRoom, getRoom, deleteRoom, startExpiry } from '../../rooms/roomManager.js';
import { clearAllRooms } from '../../rooms/roomStore.js';
import { ROOM_EXPIRY_MS } from '../../config/constants.js';

describe('roomManager', () => {
  beforeEach(() => clearAllRooms());

  it('creates a room with a 6-char alphanumeric code', () => {
    const room = createRoom('en', 'creator-id');
    expect(room.code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('retrieves the created room', () => {
    const room = createRoom('en', 'creator-id');
    expect(getRoom(room.code)).toBe(room);
  });

  it('deletes a room', () => {
    const room = createRoom('en', 'creator-id');
    deleteRoom(room.code);
    expect(getRoom(room.code)).toBeUndefined();
  });

  it('creates rooms with unique codes', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 20; i++) {
      codes.add(createRoom('en', 'cid').code);
    }
    expect(codes.size).toBe(20);
  });

  it('startExpiry removes rooms past ROOM_EXPIRY_MS', () => {
    vi.useFakeTimers();
    try {
      const room = createRoom('en', 'cid');
      room.lastActivityAt -= ROOM_EXPIRY_MS + 1;
      const timer = startExpiry();
      vi.advanceTimersByTime(5 * 60 * 1000 + 100);
      expect(getRoom(room.code)).toBeUndefined();
      clearInterval(timer);
    } finally {
      vi.useRealTimers();
    }
  });
});
