import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Board from '../components/game/Board.js';
import { useGameStore } from '../store/gameStore.js';
import type { CardPublic } from '@signal/shared';

vi.mock('../socket/socketClient.ts', () => ({ socket: { emit: vi.fn(), on: vi.fn(), connect: vi.fn(), disconnect: vi.fn() } }));

function makeBoard(count = 25): CardPublic[] {
  return Array.from({ length: count }, (_, i) => ({
    index: i, word: `WORD${i}`, lang: 'en' as const, color: null, revealed: false,
  }));
}

describe('Board', () => {
  beforeEach(() => {
    useGameStore.setState({ board: makeBoard(), handlerBoard: null });
  });

  it('renders 25 cards', () => {
    render(<Board />);
    const board = screen.getByTestId('game-board');
    expect(board.children.length).toBe(25);
  });

  it('shows card words', () => {
    render(<Board />);
    expect(screen.getByText('WORD0')).toBeInTheDocument();
    expect(screen.getByText('WORD24')).toBeInTheDocument();
  });
});
