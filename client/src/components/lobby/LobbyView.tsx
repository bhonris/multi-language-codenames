import { useGameStore } from '../../store/gameStore.js';
import { socket } from '../../socket/socketClient.js';

export default function LobbyView() {
  const { roomCode, players, isCreator, language, myTeam, myRole } = useGameStore();

  const red = players.filter(p => p.team === 'red');
  const blue = players.filter(p => p.team === 'blue');

  const handleStart = () => socket.emit('game:start');

  const canStart = red.some(p => p.role === 'handler') && red.some(p => p.role === 'operative') &&
    blue.some(p => p.role === 'handler') && blue.some(p => p.role === 'operative');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 gap-6">
      <h1 className="text-3xl font-black tracking-widest text-white">SIGNAL</h1>
      <div className="flex items-center gap-3">
        <span className="bg-slate-700 text-slate-200 px-3 py-1 rounded-lg font-mono tracking-widest text-lg font-bold">{roomCode}</span>
        <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/room/${roomCode}`)} className="text-slate-400 hover:text-white text-sm transition-colors">Copy Link</button>
        <span className="bg-indigo-700 text-indigo-200 px-2 py-1 rounded text-xs uppercase font-bold">{language}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
        <TeamColumn team="red" players={red} myTeam={myTeam} myRole={myRole} />
        <TeamColumn team="blue" players={blue} myTeam={myTeam} myRole={myRole} />
      </div>

      <div className="flex gap-2">
        {(['red', 'blue'] as const).map(t => (
          <button key={t} onClick={() => socket.emit('player:set-team', t)}
            className={`px-4 py-2 rounded-lg font-bold transition-colors capitalize ${myTeam === t ? (t === 'red' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white') : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
            {t === 'red' ? 'Join Red' : 'Join Blue'}
          </button>
        ))}
      </div>

      {myTeam && (
        <div className="flex gap-2">
          <button onClick={() => socket.emit('player:set-role', 'handler')}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${myRole === 'handler' ? 'bg-yellow-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
            Handler
          </button>
          <button onClick={() => socket.emit('player:set-role', 'operative')}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${myRole === 'operative' ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
            Operative
          </button>
        </div>
      )}

      {isCreator && (
        <button onClick={handleStart} disabled={!canStart}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors text-lg">
          Start Game
        </button>
      )}
    </div>
  );
}

function TeamColumn({ team, players, myTeam, myRole }: { team: 'red' | 'blue'; players: import('@signal/shared').Player[]; myTeam: string | null; myRole: string }) {
  const bg = team === 'red' ? 'bg-red-900/30 border-red-700' : 'bg-blue-900/30 border-blue-700';
  const header = team === 'red' ? 'text-red-400' : 'text-blue-400';
  return (
    <div className={`rounded-xl border p-4 ${bg} min-h-32`}>
      <h3 className={`font-black uppercase mb-3 ${header}`}>{team} team</h3>
      {players.length === 0 && <p className="text-slate-500 text-sm">No players yet</p>}
      {players.map(p => (
        <div key={p.id} className="flex items-center gap-2 mb-1">
          <span className="text-white text-sm truncate">{p.displayName}</span>
          <span className={`text-xs px-1 rounded font-bold ${p.role === 'handler' ? 'bg-yellow-700 text-yellow-200' : 'bg-green-800 text-green-200'}`}>
            {p.role === 'handler' ? 'H' : 'O'}
          </span>
          {!p.connected && <span className="text-xs text-slate-500">(away)</span>}
        </div>
      ))}
    </div>
  );
}
