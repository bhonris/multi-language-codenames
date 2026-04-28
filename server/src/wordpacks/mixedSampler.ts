import { MIXED_MIN_PER_LANG, GRID_SIZE } from '../config/constants.js';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sampleMixed(enWords: string[], thWords: string[]): Array<{ word: string; lang: 'en' | 'th' }> {
  // Sample one extra per language so the TRAITOR card replacing a slot still leaves MIXED_MIN_PER_LANG in the board
  const effectiveMin = MIXED_MIN_PER_LANG + 1;
  const maxTh = GRID_SIZE - effectiveMin;
  const nTh = Math.floor(Math.random() * (maxTh - effectiveMin + 1)) + effectiveMin;
  const nEn = GRID_SIZE - nTh;

  const sampledTh = shuffle(thWords).slice(0, nTh).map(w => ({ word: w, lang: 'th' as const }));
  const sampledEn = shuffle(enWords).slice(0, nEn).map(w => ({ word: w, lang: 'en' as const }));

  return shuffle([...sampledTh, ...sampledEn]);
}

export function sampleMono(words: string[], lang: 'en' | 'th'): Array<{ word: string; lang: 'en' | 'th' }> {
  return shuffle(words).slice(0, GRID_SIZE).map(w => ({ word: w, lang }));
}
