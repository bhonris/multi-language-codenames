import { useGameStore } from '../../store/gameStore.js';
import Board from './Board.js';
import CluePanel from './CluePanel.js';
import ChatPanel from '../chat/ChatPanel.js';
import GameOverOverlay from './GameOverOverlay.js';
import ScoreBar from './ScoreBar.js';

export default function GameView() {
  const game = useGameStore(s => s.game);
  const gamePaused = useGameStore(s => s.gamePaused);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row gap-4 p-4 relative">
      <div className="flex-1 flex flex-col gap-4">
        <ScoreBar />
        <Board />
        <CluePanel />
      </div>
      <div className="lg:w-72 w-full">
        <ChatPanel />
      </div>
      {game?.phase === 'ended' && <GameOverOverlay />}
      {gamePaused && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-8 text-center shadow-2xl">
            <p className="text-2xl font-black text-white mb-2">Waiting for players…</p>
            <p className="text-slate-400 text-sm">Game paused until more players reconnect</p>
          </div>
        </div>
      )}
    </div>
  );
}
