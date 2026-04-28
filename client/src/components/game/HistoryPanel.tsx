import { useEffect, useRef } from 'react';
import { useGameStore, type GameEvent } from '../../store/gameStore.js';

function EventRow({ event }: { event: GameEvent }) {
  const teamColor = (team?: string) =>
    team === 'red' ? 'text-red-400' : team === 'blue' ? 'text-blue-400' : 'text-slate-400';

  const resultStyle: Record<string, string> = {
    red: 'text-red-400',
    blue: 'text-blue-400',
    neutral: 'text-slate-400',
    traitor: 'text-yellow-400',
  };

  const resultLabel: Record<string, string> = {
    red: 'red',
    blue: 'blue',
    neutral: 'neutral',
    traitor: 'TRAITOR',
  };

  if (event.type === 'game-start') {
    return (
      <div className="text-center text-xs text-slate-500 py-1 border-b border-slate-700">
        New game — <span className={teamColor(event.firstTeam)}>{event.firstTeam?.toUpperCase()}</span> goes first (9 cards)
      </div>
    );
  }

  if (event.type === 'clue') {
    return (
      <div className="flex items-baseline gap-2 py-1">
        <span className={`text-xs font-bold uppercase ${teamColor(event.team)}`}>{event.team}</span>
        <span className="text-white font-bold">{event.clueWord}</span>
        <span className="text-indigo-400 text-sm font-bold">
          {event.clueCount === 0 ? '∞' : event.clueCount}
        </span>
      </div>
    );
  }

  if (event.type === 'guess') {
    const result = event.guessResult ?? 'neutral';
    return (
      <div className="flex items-center gap-2 py-0.5 pl-3">
        <span className="text-slate-500 text-xs">→</span>
        <span className="text-slate-200 text-sm">{event.guessWord}</span>
        <span className={`text-xs font-bold ml-auto ${resultStyle[result]}`}>
          {resultLabel[result]}
        </span>
      </div>
    );
  }

  if (event.type === 'turn-change') {
    return (
      <div className="text-center text-xs text-slate-500 py-1">
        <span className={`font-bold ${teamColor(event.team)}`}>{event.team?.toUpperCase()}</span>
        {' '}team's turn
      </div>
    );
  }

  if (event.type === 'game-over') {
    return (
      <div className={`text-center text-sm font-bold py-2 border-t border-slate-700 ${teamColor(event.winner)}`}>
        {event.winner?.toUpperCase()} wins
        <span className="text-slate-500 font-normal text-xs ml-1">
          ({event.winReason === 'traitor-hit' ? 'traitor hit' : 'cards cleared'})
        </span>
      </div>
    );
  }

  return null;
}

export default function HistoryPanel() {
  const gameHistory = useGameStore(s => s.gameHistory);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameHistory]);

  return (
    <div className="flex flex-col h-full bg-slate-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-700 font-bold text-slate-300 text-sm shrink-0">
        History
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-0.5">
        {gameHistory.length === 0 ? (
          <p className="text-slate-600 text-xs text-center pt-4">No events yet</p>
        ) : (
          gameHistory.map(event => <EventRow key={event.id} event={event} />)
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
