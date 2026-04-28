import { describe, it, expect } from 'vitest';
import { sampleMixed, sampleMono } from '../../wordpacks/mixedSampler.js';

const enWords = Array.from({ length: 400 }, (_, i) => `EN${i}`);
const thWords = Array.from({ length: 400 }, (_, i) => `TH${i}`);

describe('sampleMixed', () => {
  it('returns exactly 25 items', () => {
    expect(sampleMixed(enWords, thWords)).toHaveLength(25);
  });

  it('always has at least 5 of each language', () => {
    for (let i = 0; i < 50; i++) {
      const result = sampleMixed(enWords, thWords);
      const en = result.filter(w => w.lang === 'en').length;
      const th = result.filter(w => w.lang === 'th').length;
      expect(en).toBeGreaterThanOrEqual(5);
      expect(th).toBeGreaterThanOrEqual(5);
    }
  });

  it('has no duplicate words', () => {
    const result = sampleMixed(enWords, thWords);
    const words = result.map(w => w.word);
    expect(new Set(words).size).toBe(25);
  });
});

describe('sampleMono', () => {
  it('returns exactly 25 items all same lang', () => {
    const result = sampleMono(enWords, 'en');
    expect(result).toHaveLength(25);
    expect(result.every(w => w.lang === 'en')).toBe(true);
  });
});
