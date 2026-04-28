import { create } from 'zustand';
import type { CardPublic, Card, Team, GameState, Language } from '@signal/shared';
import type { ChatMessage } from '@signal/shared';
import type { Player } from '@signal/shared';

interface GameStore {
  roomCode: string | null;
  playerId: string | null;
  isCreator: boolean;
  language: Language | null;
  players: Player[];
  board: CardPublic[];
  handlerBoard: Card[] | null;
  game: GameState | null;
  chatMessages: ChatMessage[];
  myRole: 'handler' | 'operative';
  myTeam: Team | null;
  gamePaused: boolean;

  setRoomSnapshot: (snapshot: {
    code: string; language: Language; players: Player[]; game: GameState; board: Card[]; chatHistory: ChatMessage[]; isCreator: boolean;
  }, playerId: string) => void;
  updatePlayer: (player: Player) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  setOperativeBoard: (board: CardPublic[]) => void;
  setHandlerBoard: (board: Card[]) => void;
  revealCard: (cardIndex: number, color: import('@signal/shared').CardColor) => void;
  setTurn: (activeTeam: Team, guessesRemaining: number | null) => void;
  setClue: (word: string, count: number, team: Team) => void;
  setGameOver: (winner: Team, reason: 'cards-cleared' | 'traitor-hit') => void;
  addChatMessage: (msg: ChatMessage) => void;
  setLanguage: (language: Language) => void;
  setGamePaused: (paused: boolean) => void;
  reset: () => void;
}

const initialState = {
  roomCode: null,
  playerId: null,
  isCreator: false,
  language: null,
  players: [],
  board: [],
  handlerBoard: null,
  game: null,
  chatMessages: [],
  myRole: 'operative' as const,
  myTeam: null,
  gamePaused: false,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  setRoomSnapshot: (snapshot, playerId) => {
    const me = snapshot.players.find(p => p.id === playerId);
    set({
      roomCode: snapshot.code,
      playerId,
      isCreator: snapshot.isCreator,
      language: snapshot.language,
      players: snapshot.players,
      board: snapshot.board.map(c => ({ ...c, color: c.revealed ? c.color : null })),
      game: snapshot.game,
      chatMessages: snapshot.chatHistory,
      myRole: me?.role ?? 'operative',
      myTeam: me?.team ?? null,
    });
  },

  updatePlayer: (player) => set(s => ({
    players: s.players.map(p => p.id === player.id ? player : p),
    myRole: player.id === s.playerId ? player.role : s.myRole,
    myTeam: player.id === s.playerId ? player.team : s.myTeam,
  })),

  addPlayer: (player) => set(s => ({ players: [...s.players, player] })),
  removePlayer: (playerId) => set(s => ({
    players: s.players.map(p => p.id === playerId ? { ...p, connected: false } : p),
  })),

  setOperativeBoard: (board) => set(s => ({ board, game: s.game ? { ...s.game, phase: 'playing' } : null })),
  setHandlerBoard: (board) => set({ handlerBoard: board }),

  revealCard: (cardIndex, color) => set(s => ({
    board: s.board.map(c => c.index === cardIndex ? { ...c, color, revealed: true } : c),
    handlerBoard: s.handlerBoard
      ? s.handlerBoard.map(c => c.index === cardIndex ? { ...c, revealed: true } : c)
      : null,
    game: s.game ? {
      ...s.game,
      redRemaining: color === 'red' ? s.game.redRemaining - 1 : s.game.redRemaining,
      blueRemaining: color === 'blue' ? s.game.blueRemaining - 1 : s.game.blueRemaining,
    } : null,
  })),

  setTurn: (activeTeam, guessesRemaining) => set(s => ({
    game: s.game ? { ...s.game, activeTeam, guessesRemaining, currentClue: guessesRemaining === null ? null : s.game.currentClue } : null,
  })),

  setClue: (word, count, team) => set(s => ({
    game: s.game ? { ...s.game, currentClue: { word, count, team }, guessesRemaining: count === 0 ? null : count + 1 } : null,
  })),

  setGameOver: (winner, reason) => set(s => ({
    game: s.game ? { ...s.game, phase: 'ended', winner, winReason: reason } : null,
  })),

  addChatMessage: (msg) => set(s => ({ chatMessages: [...s.chatMessages, msg] })),

  setLanguage: (language) => set({ language }),
  setGamePaused: (paused) => set({ gamePaused: paused }),

  reset: () => set(initialState),
}));
