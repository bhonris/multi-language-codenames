import { describe, it, expect } from 'vitest';
import { validateClue } from '../../domain/clueValidator.js';
import type { Card } from '@signal/shared';

const makeCard = (word: string, revealed = false): Card => ({
  index: 0, word, lang: 'en', color: 'red', revealed,
});

describe('validateClue', () => {
  it('rejects empty clue', () => {
    expect(validateClue('', [makeCard('APPLE')])).toEqual({ valid: false, reason: 'CLUE_EMPTY' });
  });

  it('rejects clue matching an unrevealed board word (case-insensitive)', () => {
    const board = [makeCard('APPLE')];
    expect(validateClue('apple', board)).toEqual({ valid: false, reason: 'CLUE_MATCHES_BOARD' });
    expect(validateClue('APPLE', board)).toEqual({ valid: false, reason: 'CLUE_MATCHES_BOARD' });
  });

  it('accepts clue matching a revealed card', () => {
    const board = [makeCard('APPLE', true)];
    expect(validateClue('apple', board)).toEqual({ valid: true });
  });

  it('accepts a valid clue not on the board', () => {
    const board = [makeCard('APPLE'), makeCard('BANANA')];
    expect(validateClue('mango', board)).toEqual({ valid: true });
  });
});
