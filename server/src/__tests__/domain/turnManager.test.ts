import { describe, it, expect } from 'vitest';
import { applyGuess, nextTeam } from '../../domain/turnManager.js';
import type { Card } from '@signal/shared';

function makeCard(color: import('@signal/shared').CardColor, index = 0, revealed = false): Card {
  return { index, word: 'X', lang: 'en', color, revealed };
}

describe('applyGuess', () => {
  it('reveals correct team card, decrements guesses', () => {
    const board = [makeCard('red', 0), makeCard('blue', 1)];
    const result = applyGuess(board, 0, 'red', 3);
    expect(result.updatedBoard[0].revealed).toBe(true);
    expect(result.revealedColor).toBe('red');
    expect(result.traitorHit).toBe(false);
    expect(result.turnEnded).toBe(false);
    expect(result.guessesRemaining).toBe(2);
  });

  it('ends turn on wrong team guess', () => {
    const board = [makeCard('blue', 0), makeCard('red', 1)];
    const result = applyGuess(board, 0, 'red', 3);
    expect(result.turnEnded).toBe(true);
    expect(result.wrongTeam).toBe(true);
  });

  it('ends turn on neutral guess', () => {
    const board = [makeCard('neutral', 0)];
    const result = applyGuess(board, 0, 'red', 3);
    expect(result.turnEnded).toBe(true);
  });

  it('sets traitorHit on traitor card', () => {
    const board = [makeCard('traitor', 0)];
    const result = applyGuess(board, 0, 'red', 3);
    expect(result.traitorHit).toBe(true);
    expect(result.turnEnded).toBe(true);
  });

  it('ends turn when guesses reach zero', () => {
    const board = [makeCard('red', 0)];
    const result = applyGuess(board, 0, 'red', 1);
    expect(result.turnEnded).toBe(true);
    expect(result.guessesRemaining).toBeNull();
  });

  it('throws for out-of-bounds card index', () => {
    const board = [makeCard('red', 0)];
    expect(() => applyGuess(board, 5, 'red', 3)).toThrow();
  });

  it('handles null guessesRemaining (unlimited clue)', () => {
    const board = [makeCard('red', 0), makeCard('blue', 1)];
    const result = applyGuess(board, 0, 'red', null);
    expect(result.turnEnded).toBe(false);
    expect(result.guessesRemaining).toBeNull();
  });
});

describe('nextTeam', () => {
  it('alternates teams', () => {
    expect(nextTeam('red')).toBe('blue');
    expect(nextTeam('blue')).toBe('red');
  });
});
