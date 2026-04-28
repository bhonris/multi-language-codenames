import type { Card } from '@signal/shared';
import type { Language } from '@signal/shared';
import { getEnWords, getThWords } from '../wordpacks/wordPackLoader.js';
import { sampleMixed, sampleMono } from '../wordpacks/mixedSampler.js';
import { assignColors } from './colorAssigner.js';

export function generateBoard(language: Language): Card[] {
  const enWords = getEnWords();
  const thWords = getThWords();

  const sampled =
    language === 'mixed'
      ? sampleMixed(enWords, thWords)
      : language === 'th'
      ? sampleMono(thWords, 'th')
      : sampleMono(enWords, 'en');

  const firstTeam: 'red' | 'blue' = Math.random() < 0.5 ? 'red' : 'blue';
  const colors = assignColors(firstTeam);

  return sampled.map((entry, index) => {
    const color = colors[index];
    return {
      index,
      word: color === 'traitor' ? 'TRAITOR' : entry.word,
      lang: entry.lang,
      color,
      revealed: false,
    };
  });
}
