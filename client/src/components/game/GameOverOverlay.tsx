import { useGameStore } from '../../store/gameStore.js';
import { socket } from '../../socket/socketClient.js';

export default function GameOverOverlay() {
  const game = useGameStore(s => s.game);
  if (!game?.winner) return null;

  const isRed = game.winner === 'red';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-2xl p-10 text-center shadow-2xl max-w-sm w-full mx-4">
        <div className={`text-6xl font-black mb-2 ${isRed ? 'text-red-400' : 'text-blue-400'}`}>
          {game.winner.toUpperCase()} WINS
        </div>
        <p className="text-slate-400 mb-8">
          {game.winReason === 'traitor-hit' ? 'TRAITOR card was revealed' : 'All cards cleared'}
        </p>
        <button onClick={() => socket.emit('game:rematch')} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-colors text-lg">
          Rematch
        </button>
      </div>
    </div>
  );
}
