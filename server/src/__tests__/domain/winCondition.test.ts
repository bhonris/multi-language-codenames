import { describe, it, expect } from 'vitest';
import { checkWin } from '../../domain/winCondition.js';
import type { Card } from '@signal/shared';

function makeCard(color: import('@signal/shared').CardColor, revealed: boolean): Card {
  return { index: 0, word: 'X', lang: 'en', color, revealed };
}

describe('checkWin', () => {
  it('returns null when game is ongoing', () => {
    const board = [makeCard('red', false), makeCard('blue', false)];
    expect(checkWin(board)).toBeNull();
  });

  it('detects red win', () => {
    const board = [makeCard('red', true), makeCard('blue', false)];
    expect(checkWin(board)).toEqual({ winner: 'red', reason: 'cards-cleared' });
  });

  it('detects blue win', () => {
    const board = [makeCard('red', false), makeCard('blue', true)];
    expect(checkWin(board)).toEqual({ winner: 'blue', reason: 'cards-cleared' });
  });
});
