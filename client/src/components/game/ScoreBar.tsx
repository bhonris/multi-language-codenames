import { useGameStore } from '../../store/gameStore.js';

export default function ScoreBar() {
  const { game, roomCode } = useGameStore();
  if (!game) return null;

  return (
    <div className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-red-400 font-black text-lg">{game.redRemaining}</span>
        <span className="text-slate-400 text-sm">Red</span>
      </div>
      <div className="text-center">
        <div className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${game.activeTeam === 'red' ? 'bg-red-700 text-red-200' : 'bg-blue-700 text-blue-200'}`}>
          {game.activeTeam}'s turn
        </div>
        <div className="text-slate-500 text-xs mt-1 font-mono">{roomCode}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-slate-400 text-sm">Blue</span>
        <span className="text-blue-400 font-black text-lg">{game.blueRemaining}</span>
      </div>
    </div>
  );
}
