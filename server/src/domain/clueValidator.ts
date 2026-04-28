import type { Card } from '@signal/shared';

function normalize(word: string): string {
  return word.trim().toLowerCase();
}

export function validateClue(clueWord: string, board: Card[]): { valid: boolean; reason?: string } {
  if (!clueWord || clueWord.trim().length === 0) {
    return { valid: false, reason: 'CLUE_EMPTY' };
  }
  const normalizedClue = normalize(clueWord);
  const matchingCard = board.find(c => !c.revealed && normalize(c.word) === normalizedClue);
  if (matchingCard) {
    return { valid: false, reason: 'CLUE_MATCHES_BOARD' };
  }
  return { valid: true };
}
