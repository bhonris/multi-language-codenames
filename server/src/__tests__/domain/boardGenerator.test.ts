import { describe, it, expect, beforeEach } from 'vitest';
import { generateBoard } from '../../domain/boardGenerator.js';
import { resetCache } from '../../wordpacks/wordPackLoader.js';

describe('generateBoard', () => {
  it('generates exactly 25 cards', () => {
    const board = generateBoard('en');
    expect(board).toHaveLength(25);
  });

  it('has correct color distribution (en)', () => {
    const board = generateBoard('en');
    const colors = board.map(c => c.color);
    const red = colors.filter(c => c === 'red').length;
    const blue = colors.filter(c => c === 'blue').length;
    const neutral = colors.filter(c => c === 'neutral').length;
    const traitor = colors.filter(c => c === 'traitor').length;
    expect(traitor).toBe(1);
    expect(neutral).toBe(7);
    expect(red + blue).toBe(17);
    expect(red === 9 || red === 8).toBe(true);
  });

  it('has no duplicate words', () => {
    const board = generateBoard('en');
    const words = board.filter(c => c.color !== 'traitor').map(c => c.word);
    expect(new Set(words).size).toBe(words.length);
  });

  it('TRAITOR card word is "TRAITOR"', () => {
    const board = generateBoard('en');
    const traitor = board.find(c => c.color === 'traitor');
    expect(traitor?.word).toBe('TRAITOR');
  });

  it('mixed mode contains at least 5 EN and 5 TH words', () => {
    for (let i = 0; i < 20; i++) {
      const board = generateBoard('mixed');
      const nonTraitor = board.filter(c => c.color !== 'traitor');
      const enCount = nonTraitor.filter(c => c.lang === 'en').length;
      const thCount = nonTraitor.filter(c => c.lang === 'th').length;
      expect(enCount).toBeGreaterThanOrEqual(5);
      expect(thCount).toBeGreaterThanOrEqual(5);
    }
  });

  it('generates a 25-card board in thai language with all TH words', () => {
    const board = generateBoard('th');
    expect(board).toHaveLength(25);
    const nonTraitor = board.filter(c => c.color !== 'traitor');
    expect(nonTraitor.every(c => c.lang === 'th')).toBe(true);
  });
});
