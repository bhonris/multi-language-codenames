import { create } from 'zustand';
import type { CardPublic, Card, Team, GameState, Language, GameStartState, CardColor } from '@signal/shared';
import type { ChatMessage } from '@signal/shared';
import type { Player } from '@signal/shared';

export type GameEventType = 'game-start' | 'clue' | 'guess' | 'turn-change' | 'game-over';

export interface GameEvent {
  id: string;
  type: GameEventType;
  timestamp: number;
  team?: Team;
  clueWord?: string;
  clueCount?: number;
  guessWord?: string;
  guessResult?: CardColor;
  firstTeam?: Team;
  winner?: Team;
  winReason?: 'cards-cleared' | 'traitor-hit';
}

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
  gameHistory: GameEvent[];

  setRoomSnapshot: (snapshot: {
    code: string; language: Language; players: Player[]; game: GameState; board: Card[]; chatHistory: ChatMessage[]; isCreator: boolean;
  }, playerId: string) => void;
  updatePlayer: (player: Player) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  setOperativeBoard: (board: CardPublic[], state: GameStartState) => void;
  setHandlerBoard: (board: Card[]) => void;
  revealCard: (cardIndex: number, color: CardColor, word: string) => void;
  setTurn: (activeTeam: Team, guessesRemaining: number | null) => void;
  setClue: (word: string, count: number, team: Team) => void;
  setGameOver: (winner: Team, reason: 'cards-cleared' | 'traitor-hit') => void;
  addChatMessage: (msg: ChatMessage) => void;
  setLanguage: (language: Language) => void;
  setGamePaused: (paused: boolean) => void;
  addHistoryEvent: (event: Omit<GameEvent, 'id' | 'timestamp'>) => void;
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
  gameHistory: [],
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
      gameHistory: [],
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

  setOperativeBoard: (board, state) => set(s => ({
    board,
    game: s.game ? {
      ...s.game,
      phase: 'playing' as const,
      redRemaining: state.redRemaining,
      blueRemaining: state.blueRemaining,
      firstTeam: state.firstTeam,
      activeTeam: state.firstTeam,
      winner: null,
      winReason: null,
      currentClue: null,
      guessesRemaining: null,
    } : {
      phase: 'playing' as const,
      activeTeam: state.firstTeam,
      guessesRemaining: null,
      currentClue: null,
      redRemaining: state.redRemaining,
      blueRemaining: state.blueRemaining,
      winner: null,
      winReason: null,
      firstTeam: state.firstTeam,
    },
    handlerBoard: null,
    gameHistory: [{
      id: crypto.randomUUID(),
      type: 'game-start' as const,
      timestamp: Date.now(),
      firstTeam: state.firstTeam,
    }],
  })),

  setHandlerBoard: (board) => set({ handlerBoard: board }),

  revealCard: (cardIndex, color, word) => set(s => {
    const newHistory = [...s.gameHistory, {
      id: crypto.randomUUID(),
      type: 'guess' as const,
      timestamp: Date.now(),
      team: s.game?.activeTeam ?? undefined,
      guessWord: word,
      guessResult: color,
    }];
    if (newHistory.length > 200) newHistory.shift();
    return {
      board: s.board.map(c => c.index === cardIndex ? { ...c, color, revealed: true } : c),
      handlerBoard: s.handlerBoard
        ? s.handlerBoard.map(c => c.index === cardIndex ? { ...c, revealed: true } : c)
        : null,
      game: s.game ? {
        ...s.game,
        redRemaining: color === 'red' ? s.game.redRemaining - 1 : s.game.redRemaining,
        blueRemaining: color === 'blue' ? s.game.blueRemaining - 1 : s.game.blueRemaining,
      } : null,
      gameHistory: newHistory,
    };
  }),

  setTurn: (activeTeam, guessesRemaining) => set(s => {
    // Only log turn-change when the team actually switches mid-game, not on initial start
    const teamChanged = s.game?.activeTeam !== activeTeam;
    const newHistory = guessesRemaining === null && teamChanged && s.game?.phase === 'playing'
      ? [...s.gameHistory, {
          id: crypto.randomUUID(),
          type: 'turn-change' as const,
          timestamp: Date.now(),
          team: activeTeam,
        }]
      : s.gameHistory;
    return {
      game: s.game ? {
        ...s.game,
        activeTeam,
        guessesRemaining,
        currentClue: guessesRemaining === null ? null : s.game.currentClue,
      } : null,
      gameHistory: newHistory,
    };
  }),

  setClue: (word, count, team) => set(s => {
    const newHistory = [...s.gameHistory, {
      id: crypto.randomUUID(),
      type: 'clue' as const,
      timestamp: Date.now(),
      team,
      clueWord: word,
      clueCount: count,
    }];
    if (newHistory.length > 200) newHistory.shift();
    return {
      game: s.game ? {
        ...s.game,
        currentClue: { word, count, team },
        guessesRemaining: count === 0 ? null : count + 1,
      } : null,
      gameHistory: newHistory,
    };
  }),

  setGameOver: (winner, reason) => set(s => {
    const newHistory = [...s.gameHistory, {
      id: crypto.randomUUID(),
      type: 'game-over' as const,
      timestamp: Date.now(),
      winner,
      winReason: reason,
    }];
    return {
      game: s.game ? { ...s.game, phase: 'ended', winner, winReason: reason } : null,
      gameHistory: newHistory,
    };
  }),

  addChatMessage: (msg) => set(s => ({ chatMessages: [...s.chatMessages, msg] })),

  setLanguage: (language) => set({ language }),
  setGamePaused: (paused) => set({ gamePaused: paused }),

  addHistoryEvent: (event) => set(s => {
    const newHistory = [...s.gameHistory, { ...event, id: crypto.randomUUID(), timestamp: Date.now() }];
    if (newHistory.length > 200) newHistory.shift();
    return { gameHistory: newHistory };
  }),

  reset: () => set(initialState),
}));
