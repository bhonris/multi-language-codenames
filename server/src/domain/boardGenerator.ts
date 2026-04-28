import type { Card, Team } from '@signal/shared';
import type { Language } from '@signal/shared';
import { getEnWords, getThWords } from '../wordpacks/wordPackLoader.js';
import { sampleMixed, sampleMono } from '../wordpacks/mixedSampler.js';
import { assignColors } from './colorAssigner.js';

export interface BoardResult {
  board: Card[];
  firstTeam: Team;
}

export function generateBoard(language: Language): BoardResult {
  const enWords = getEnWords();
  const thWords = getThWords();

  const sampled =
    language === 'mixed'
      ? sampleMixed(enWords, thWords)
      : language === 'th'
      ? sampleMono(thWords, 'th')
      : sampleMono(enWords, 'en');

  const firstTeam: Team = Math.random() < 0.5 ? 'red' : 'blue';
  const colors = assignColors(firstTeam);

  const board: Card[] = sampled.map((entry, index) => ({
    index,
    word: entry.word,
    lang: entry.lang,
    color: colors[index],
    revealed: false,
  }));

  return { board, firstTeam };
}
