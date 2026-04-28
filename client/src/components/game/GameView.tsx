import { useGameStore } from '../../store/gameStore.js';
import Board from './Board.js';
import CluePanel from './CluePanel.js';
import GameOverOverlay from './GameOverOverlay.js';
import ScoreBar from './ScoreBar.js';
import Sidebar from './Sidebar.js';

export default function GameView() {
  const game = useGameStore(s => s.game);
  const gamePaused = useGameStore(s => s.gamePaused);

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row gap-3 p-3 bg-slate-900 relative">
      {/* Main game column */}
      <div className="flex-1 lg:min-h-0 flex flex-col gap-3">
        <ScoreBar />
        {/* Board fills remaining space on desktop, natural aspect on mobile */}
        <div className="flex-1 lg:min-h-0">
          <Board />
        </div>
        <CluePanel />
      </div>
      {/* Sidebar: chat + history */}
      <Sidebar />
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
