import { useGameStore } from '../../store/gameStore.js';
import { socket } from '../../socket/socketClient.js';

export default function GameOverOverlay() {
  const game = useGameStore(s => s.game);
  const myRole = useGameStore(s => s.myRole);
  const myTeam = useGameStore(s => s.myTeam);
  const players = useGameStore(s => s.players);

  if (!game?.winner) return null;

  const isRed = game.winner === 'red';
  const isHandler = myRole === 'handler';

  // Can only switch to handler if no other connected player on this team is already handler
  const teamHasOtherHandler = players.some(
    p => p.team === myTeam && p.role === 'handler' && p.connected
  );
  const canBecomeHandler = !isHandler && !teamHasOtherHandler && !!myTeam;

  const toggleRole = () => {
    if (isHandler) {
      socket.emit('player:set-role', 'operative');
    } else if (canBecomeHandler) {
      socket.emit('player:set-role', 'handler');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-2xl p-8 text-center shadow-2xl max-w-sm w-full mx-4 flex flex-col gap-5">
        {/* Result */}
        <div>
          <div className={`text-5xl font-black mb-1 ${isRed ? 'text-red-400' : 'text-blue-400'}`}>
            {game.winner.toUpperCase()} WINS
          </div>
          <p className="text-slate-400 text-sm">
            {game.winReason === 'traitor-hit' ? 'TRAITOR card was revealed' : 'All cards cleared'}
          </p>
        </div>

        {/* Role change */}
        {myTeam && (
          <div className="flex items-center justify-between bg-slate-700 rounded-xl px-4 py-3">
            <div className="text-left">
              <p className="text-slate-400 text-xs uppercase font-bold">Your role</p>
              <p className="text-white font-bold capitalize">{myRole}</p>
            </div>
            <button
              onClick={toggleRole}
              className={`text-sm px-3 py-1.5 rounded-lg font-bold transition-colors ${
                isHandler || canBecomeHandler
                  ? 'bg-slate-600 hover:bg-slate-500 text-white'
                  : 'bg-slate-700 text-slate-600 cursor-not-allowed'
              }`}
              disabled={!isHandler && !canBecomeHandler}
              title={!isHandler && !canBecomeHandler ? 'Another player is already handler' : undefined}
            >
              Switch to {isHandler ? 'Operative' : 'Handler'}
            </button>
          </div>
        )}

        {/* Rematch */}
        <button
          onClick={() => socket.emit('game:rematch')}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors text-lg"
        >
          Rematch
        </button>
      </div>
    </div>
  );
}
