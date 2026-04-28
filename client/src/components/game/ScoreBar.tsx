import { useGameStore } from '../../store/gameStore.js';

export default function ScoreBar() {
  const { game, roomCode } = useGameStore();
  if (!game) return null;

  const redIsFirst = game.firstTeam === 'red';
  const isRedActive = game.activeTeam === 'red';
  const isBlueActive = game.activeTeam === 'blue';

  return (
    <div className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-2.5 shrink-0">
      {/* Red */}
      <div className="flex items-center gap-2 min-w-[70px]">
        <span
          className={`font-black text-xl transition-all ${
            isRedActive ? 'text-red-400 scale-110' : 'text-red-700'
          }`}
        >
          {game.redRemaining}
        </span>
        <div className="flex flex-col">
          <span className={`text-xs font-bold uppercase ${isRedActive ? 'text-red-300' : 'text-slate-500'}`}>
            Red
          </span>
          {redIsFirst && (
            <span className="text-yellow-500 text-[0.6rem] leading-none">first</span>
          )}
        </div>
      </div>

      {/* Center */}
      <div className="text-center">
        <div
          className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
            isRedActive ? 'bg-red-700 text-red-200' : 'bg-blue-700 text-blue-200'
          }`}
        >
          {game.activeTeam}'s turn
        </div>
        <div className="text-slate-500 text-xs mt-1 font-mono">{roomCode}</div>
      </div>

      {/* Blue */}
      <div className="flex items-center gap-2 justify-end min-w-[70px]">
        <div className="flex flex-col items-end">
          <span className={`text-xs font-bold uppercase ${isBlueActive ? 'text-blue-300' : 'text-slate-500'}`}>
            Blue
          </span>
          {!redIsFirst && (
            <span className="text-yellow-500 text-[0.6rem] leading-none">first</span>
          )}
        </div>
        <span
          className={`font-black text-xl transition-all ${
            isBlueActive ? 'text-blue-400 scale-110' : 'text-blue-700'
          }`}
        >
          {game.blueRemaining}
        </span>
      </div>
    </div>
  );
}
