import { useState } from 'react';
import { useGameStore } from '../../store/gameStore.js';
import { socket } from '../../socket/socketClient.js';

export default function CluePanel() {
  const { game, myRole, myTeam, board } = useGameStore();
  const [clueWord, setClueWord] = useState('');
  const [clueCount, setClueCount] = useState(1);
  const [error, setError] = useState('');

  const isHandlerTurn = myRole === 'handler' && game?.activeTeam === myTeam && game?.phase === 'playing' && !game.currentClue;

  const boardWords = board.map(c => c.word.toLowerCase());

  const handleSubmit = () => {
    const w = clueWord.trim();
    if (!w) { setError('Enter a clue word'); return; }
    if (boardWords.includes(w.toLowerCase())) { setError('Clue matches a board word!'); return; }
    socket.emit('game:submit-clue', w, clueCount);
    setClueWord('');
    setError('');
  };

  if (game?.phase !== 'playing') return null;

  return (
    <div className="bg-slate-800 rounded-xl p-4">
      {isHandlerTurn ? (
        <div className="flex flex-col gap-3">
          <p className="text-yellow-400 font-bold text-sm">Your turn to give a clue, Handler</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={clueWord}
              onChange={e => { setClueWord(e.target.value); setError(''); }}
              placeholder="One word clue..."
              className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <select value={clueCount} onChange={e => setClueCount(Number(e.target.value))} className="bg-slate-700 text-white rounded-lg px-2 py-2 outline-none">
              <option value={0}>∞</option>
              {[1,2,3,4,5,6,7,8,9].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <button onClick={handleSubmit} className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold px-4 py-2 rounded-lg transition-colors">Submit</button>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
      ) : game.currentClue ? (
        <div className="flex items-center gap-4">
          <div>
            <span className="text-slate-400 text-xs uppercase">Current Clue</span>
            <p className="text-white font-black text-2xl tracking-wider">{game.currentClue.word} <span className="text-indigo-400">{game.currentClue.count === 0 ? '∞' : game.currentClue.count}</span></p>
            {game.guessesRemaining !== null && <p className="text-slate-400 text-sm">{game.guessesRemaining} guess{game.guessesRemaining !== 1 ? 'es' : ''} remaining</p>}
          </div>
          {myRole === 'operative' && game.activeTeam === myTeam && (
            <button onClick={() => socket.emit('game:pass')} className="ml-auto bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-bold transition-colors">Pass Turn</button>
          )}
        </div>
      ) : (
        <p className="text-slate-400 text-center">Waiting for {game.activeTeam} team Handler to give a clue…</p>
      )}
    </div>
  );
}
