import type { Card, Team } from '@signal/shared';

export function checkWin(board: Card[]): { winner: Team; reason: 'cards-cleared' | 'traitor-hit' } | null {
  const redRemaining = board.filter(c => c.color === 'red' && !c.revealed).length;
  const blueRemaining = board.filter(c => c.color === 'blue' && !c.revealed).length;
  if (redRemaining === 0) return { winner: 'red', reason: 'cards-cleared' };
  if (blueRemaining === 0) return { winner: 'blue', reason: 'cards-cleared' };
  return null;
}
