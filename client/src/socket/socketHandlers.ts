import { socket } from './socketClient.js';
import { useGameStore } from '../store/gameStore.js';

let _playerId: string | null = null;

export function setPlayerId(id: string) {
  _playerId = id;
}

export function registerSocketHandlers() {
  const store = useGameStore.getState;

  socket.on('room:state', (snapshot) => {
    setPlayerId(snapshot.myPlayerId);
    store().setRoomSnapshot(snapshot, snapshot.myPlayerId);
    sessionStorage.setItem(`signal-secret-${snapshot.code}`, snapshot.myPlayerSecret);
  });
  socket.on('room:player-joined', (player) => store().addPlayer(player));
  socket.on('room:player-left', (playerId) => store().removePlayer(playerId));
  socket.on('room:player-updated', (player) => store().updatePlayer(player));
  socket.on('room:language-changed', (language) => store().setLanguage(language));
  socket.on('game:started', (board) => store().setOperativeBoard(board));
  socket.on('game:handler-board', (board) => store().setHandlerBoard(board));
  socket.on('game:clue-submitted', (word, count, team) => store().setClue(word, count, team));
  socket.on('game:card-revealed', (cardIndex, color) => store().revealCard(cardIndex, color));
  socket.on('game:turn-changed', (activeTeam, guessesRemaining) => store().setTurn(activeTeam, guessesRemaining));
  socket.on('game:over', (winner, reason) => store().setGameOver(winner, reason));
  socket.on('game:paused', (paused) => store().setGamePaused(paused));
  socket.on('chat:message', (msg) => store().addChatMessage(msg));
  socket.on('error', (code, message) => console.error('[socket error]', code, message));
}
