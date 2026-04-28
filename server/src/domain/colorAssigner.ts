import type { CardColor } from '@signal/shared';
import type { Team } from '@signal/shared';
import { FIRST_TEAM_CARDS, SECOND_TEAM_CARDS, NEUTRAL_CARDS, TRAITOR_CARDS, GRID_SIZE } from '../config/constants.js';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function assignColors(firstTeam: Team): CardColor[] {
  const secondTeam: Team = firstTeam === 'red' ? 'blue' : 'red';
  const colors: CardColor[] = [
    ...Array(FIRST_TEAM_CARDS).fill(firstTeam),
    ...Array(SECOND_TEAM_CARDS).fill(secondTeam),
    ...Array(NEUTRAL_CARDS).fill('neutral'),
    ...Array(TRAITOR_CARDS).fill('traitor'),
  ];
  if (colors.length !== GRID_SIZE) throw new Error('Color assignment total mismatch');
  return shuffle(colors);
}
