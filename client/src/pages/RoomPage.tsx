import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket/socketClient.js';
import { registerSocketHandlers } from '../socket/socketHandlers.js';
import { useGameStore } from '../store/gameStore.js';
import LobbyView from '../components/lobby/LobbyView.js';
import GameView from '../components/game/GameView.js';

export default function RoomPage() {
  const { code } = useParams<{ code: string }>();
  const handlersRegistered = useRef(false);
  const game = useGameStore(s => s.game);

  useEffect(() => {
    if (!code) return;
    if (!handlersRegistered.current) {
      registerSocketHandlers();
      handlersRegistered.current = true;
    }

    const displayName = sessionStorage.getItem('displayName') ?? 'Player';
    const playerSecret = sessionStorage.getItem(`signal-secret-${code}`) ?? undefined;

    const onConnect = () => {
      socket.emit('player:join', { roomCode: code, displayName, playerSecret });
    };

    socket.once('connect', onConnect);
    socket.connect();

    return () => {
      socket.off('connect', onConnect);
      socket.disconnect();
    };
  }, [code]);

  if (!game) return <div className="min-h-screen flex items-center justify-center text-slate-400">Connecting…</div>;

  return game.phase === 'lobby' ? <LobbyView /> : <GameView />;
}
