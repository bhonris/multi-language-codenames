import { useGameStore } from '../../store/gameStore.js';
import { socket } from '../../socket/socketClient.js';
import type { CardPublic, CardColor } from '@signal/shared';

const colorBg: Record<string, string> = {
  red: 'bg-gradient-to-br from-red-500 to-red-700 text-white border-red-400 shadow-md shadow-red-900/50',
  blue: 'bg-gradient-to-br from-blue-500 to-blue-700 text-white border-blue-400 shadow-md shadow-blue-900/50',
  neutral: 'bg-gradient-to-br from-slate-500 to-slate-600 text-slate-100 border-slate-400',
  traitor: 'bg-gradient-to-br from-gray-900 to-slate-950 text-amber-400 border-amber-500 shadow-md shadow-amber-900/40',
};

const handlerTint: Record<string, string> = {
  red: 'ring-2 ring-red-400/70 ring-inset',
  blue: 'ring-2 ring-blue-400/70 ring-inset',
  neutral: 'ring-2 ring-slate-400/50 ring-inset',
  traitor: 'ring-2 ring-yellow-400 ring-inset',
};

interface Props {
  card: CardPublic;
  handlerColor: CardColor | null;
}

export default function WordCard({ card, handlerColor }: Props) {
  const game = useGameStore(s => s.game);
  const myRole = useGameStore(s => s.myRole);
  const myTeam = useGameStore(s => s.myTeam);

  const isMyTurn = game?.activeTeam === myTeam;
  const canGuess = myRole === 'operative' && isMyTurn && !card.revealed && game?.phase === 'playing' && !!game.currentClue;

  const handleClick = () => {
    if (canGuess) socket.emit('game:guess', card.index);
  };

  const fontClass = card.lang === 'th' ? 'font-thai' : '';
  const revealedClass = card.revealed && card.color
    ? colorBg[card.color]
    : 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600 text-slate-200';
  const handlerClass = !card.revealed && handlerColor ? handlerTint[handlerColor] : '';
  const interactClass = canGuess
    ? 'cursor-pointer hover:scale-[1.04] hover:brightness-125 hover:shadow-lg active:scale-[0.97]'
    : 'cursor-default';

  return (
    <button
      onClick={handleClick}
      disabled={!canGuess}
      aria-label={`${card.word}${card.revealed ? ` revealed as ${card.color}` : ''}`}
      className={[
        'relative w-full rounded-lg border-2 flex items-center justify-center p-1',
        'aspect-[4/3] lg:aspect-auto lg:h-full',
        'transition-all duration-150 select-none',
        revealedClass,
        handlerClass,
        interactClass,
        fontClass,
      ].join(' ')}
    >
      <span
        className="text-center font-bold break-words leading-tight w-full px-0.5"
        style={{ fontSize: 'clamp(0.6rem, 1.3vw, 0.9rem)' }}
      >
        {card.word}
      </span>
    </button>
  );
}
