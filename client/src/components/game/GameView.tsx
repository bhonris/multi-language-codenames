import { useGameStore } from '../../store/gameStore.js';
import Board from './Board.js';
import CluePanel from './CluePanel.js';
import ChatPanel from '../chat/ChatPanel.js';
import GameOverOverlay from './GameOverOverlay.js';
import ScoreBar from './ScoreBar.js';

export default function GameView() {
  const game = useGameStore(s => s.game);

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
    </div>
  );
}
