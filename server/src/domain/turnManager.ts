import type { Team, Card, CardColor } from '@signal/shared';

export interface GuessResult {
  updatedBoard: Card[];
  revealedColor: CardColor;
  traitorHit: boolean;
  wrongTeam: boolean;
  turnEnded: boolean;
  guessesRemaining: number | null;
}

export function applyGuess(
  board: Card[],
  cardIndex: number,
  activeTeam: Team,
  guessesRemaining: number | null,
): GuessResult {
  const card = board[cardIndex];
  if (!card || card.revealed) {
    throw new Error('Invalid card index or already revealed');
  }

  const updatedBoard = board.map((c, i) =>
    i === cardIndex ? { ...c, revealed: true } : c,
  );
  const revealedColor = card.color;

  if (revealedColor === 'traitor') {
    return { updatedBoard, revealedColor, traitorHit: true, wrongTeam: false, turnEnded: true, guessesRemaining: null };
  }

  const wrongTeam = revealedColor !== activeTeam && revealedColor !== 'neutral';
  const hitNeutral = revealedColor === 'neutral';

  if (wrongTeam || hitNeutral) {
    return { updatedBoard, revealedColor, traitorHit: false, wrongTeam: wrongTeam || hitNeutral, turnEnded: true, guessesRemaining: null };
  }

  const newGuessesRemaining = guessesRemaining === null ? null : guessesRemaining - 1;
  const turnEnded = newGuessesRemaining === 0;

  return { updatedBoard, revealedColor, traitorHit: false, wrongTeam: false, turnEnded, guessesRemaining: turnEnded ? null : newGuessesRemaining };
}

export function nextTeam(current: Team): Team {
  return current === 'red' ? 'blue' : 'red';
}
