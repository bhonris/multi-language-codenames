import type { Server, Socket } from 'socket.io';
import type { ServerToClientEvents, ClientToServerEvents, Card, Team } from '@signal/shared';
import { getRoom, touchRoom } from '../../rooms/roomManager.js';
import { generateBoard } from '../../domain/boardGenerator.js';
import { validateClue } from '../../domain/clueValidator.js';
import { applyGuess, nextTeam } from '../../domain/turnManager.js';
import { checkWin } from '../../domain/winCondition.js';

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type AppServer = Server<ClientToServerEvents, ServerToClientEvents>;

function operativeView(board: Card[]) {
  return board.map(c => ({ ...c, color: c.revealed ? c.color : null }));
}

export function registerGameHandlers(io: AppServer, socket: AppSocket): void {
  socket.on('game:start', () => {
    const { roomCode, playerId } = socket.data;
    const room = getRoom(roomCode);
    if (!room || !playerId) return;
    if (room.creatorId !== playerId) { socket.emit('error', 'NOT_CREATOR', 'Only the creator can start'); return; }
    if (room.game.phase !== 'lobby') { socket.emit('error', 'GAME_ALREADY_STARTED', 'Game already started'); return; }

    const { board, firstTeam } = generateBoard(room.language);
    room.board = board;
    const redRemaining = board.filter(c => c.color === 'red').length;
    const blueRemaining = board.filter(c => c.color === 'blue').length;
    room.game = {
      phase: 'playing',
      activeTeam: firstTeam,
      guessesRemaining: null,
      currentClue: null,
      redRemaining,
      blueRemaining,
      winner: null,
      winReason: null,
      firstTeam,
    };
    touchRoom(roomCode);

    io.to(roomCode).emit('game:started', operativeView(board), { redRemaining, blueRemaining, firstTeam });
    for (const [, player] of room.players) {
      if (player.role === 'handler' && player.socketId) {
        io.to(player.socketId).emit('game:handler-board', board);
      }
    }
    io.to(roomCode).emit('game:turn-changed', firstTeam, null);
  });

  socket.on('game:submit-clue', (word: string, count: number) => {
    const { roomCode, playerId } = socket.data;
    const room = getRoom(roomCode);
    if (!room || !playerId) return;
    const player = room.players.get(playerId);
    if (!player || player.role !== 'handler') { socket.emit('error', 'NOT_HANDLER', 'Only handlers give clues'); return; }
    if (player.team !== room.game.activeTeam) { socket.emit('error', 'NOT_YOUR_TURN', 'Not your team\'s turn'); return; }
    if (room.game.currentClue) { socket.emit('error', 'CLUE_ALREADY_GIVEN', 'Clue already given this turn'); return; }

    const validation = validateClue(word, room.board);
    if (!validation.valid) { socket.emit('error', validation.reason!, 'Invalid clue'); return; }

    room.game.currentClue = { word: word.trim(), count, team: player.team! };
    room.game.guessesRemaining = count === 0 ? null : count + 1;
    touchRoom(roomCode);
    io.to(roomCode).emit('game:clue-submitted', word.trim(), count, player.team!);
  });

  socket.on('game:guess', (cardIndex: number) => {
    const { roomCode, playerId } = socket.data;
    const room = getRoom(roomCode);
    if (!room || !playerId) return;
    const player = room.players.get(playerId);
    if (!player || player.role !== 'operative') { socket.emit('error', 'NOT_OPERATIVE', 'Only operatives guess'); return; }
    if (player.team !== room.game.activeTeam) { socket.emit('error', 'NOT_YOUR_TURN', 'Not your team\'s turn'); return; }
    if (!room.game.currentClue) { socket.emit('error', 'NO_CLUE', 'Wait for the clue'); return; }
    if (cardIndex < 0 || cardIndex > 24 || room.board[cardIndex]?.revealed) {
      socket.emit('error', 'INVALID_CARD', 'Invalid or already revealed card');
      return;
    }

    try {
      const result = applyGuess(room.board, cardIndex, room.game.activeTeam!, room.game.guessesRemaining);
      room.board = result.updatedBoard;
      touchRoom(roomCode);
      io.to(roomCode).emit('game:card-revealed', cardIndex, result.revealedColor, room.board[cardIndex].word);

      if (result.traitorHit) {
        const losingTeam = room.game.activeTeam!;
        const winner: Team = losingTeam === 'red' ? 'blue' : 'red';
        room.game.phase = 'ended';
        room.game.winner = winner;
        room.game.winReason = 'traitor-hit';
        io.to(roomCode).emit('game:over', winner, 'traitor-hit');
        return;
      }

      if (result.revealedColor === 'red') room.game.redRemaining--;
      if (result.revealedColor === 'blue') room.game.blueRemaining--;

      const win = checkWin(room.board);
      if (win) {
        room.game.phase = 'ended';
        room.game.winner = win.winner;
        room.game.winReason = win.reason;
        io.to(roomCode).emit('game:over', win.winner, win.reason);
        return;
      }

      if (result.turnEnded) {
        const next = nextTeam(room.game.activeTeam!);
        room.game.activeTeam = next;
        room.game.currentClue = null;
        room.game.guessesRemaining = null;
        io.to(roomCode).emit('game:turn-changed', next, null);
      } else {
        room.game.guessesRemaining = result.guessesRemaining;
        io.to(roomCode).emit('game:turn-changed', room.game.activeTeam!, result.guessesRemaining);
      }
    } catch {
      socket.emit('error', 'GUESS_FAILED', 'Could not process guess');
    }
  });

  socket.on('game:pass', () => {
    const { roomCode, playerId } = socket.data;
    const room = getRoom(roomCode);
    if (!room || !playerId) return;
    const player = room.players.get(playerId);
    if (!player || player.team !== room.game.activeTeam) { socket.emit('error', 'NOT_YOUR_TURN', 'Not your team\'s turn'); return; }
    const next = nextTeam(room.game.activeTeam!);
    room.game.activeTeam = next;
    room.game.currentClue = null;
    room.game.guessesRemaining = null;
    touchRoom(roomCode);
    io.to(roomCode).emit('game:turn-changed', next, null);
  });

  socket.on('game:rematch', () => {
    const { roomCode } = socket.data;
    const room = getRoom(roomCode);
    if (!room) return;
    if (room.game.phase !== 'ended') { socket.emit('error', 'GAME_NOT_ENDED', 'Game still in progress'); return; }
    const { board, firstTeam } = generateBoard(room.language);
    room.board = board;
    const redRemaining = board.filter(c => c.color === 'red').length;
    const blueRemaining = board.filter(c => c.color === 'blue').length;
    room.game = {
      phase: 'playing',
      activeTeam: firstTeam,
      guessesRemaining: null,
      currentClue: null,
      redRemaining,
      blueRemaining,
      winner: null,
      winReason: null,
      firstTeam,
    };
    touchRoom(roomCode);
    io.to(roomCode).emit('game:started', operativeView(board), { redRemaining, blueRemaining, firstTeam });
    for (const [, player] of room.players) {
      if (player.role === 'handler' && player.socketId) {
        io.to(player.socketId).emit('game:handler-board', board);
      }
    }
    io.to(roomCode).emit('game:turn-changed', firstTeam, null);
  });
}
