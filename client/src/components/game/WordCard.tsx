import { useGameStore } from '../../store/gameStore.js';
import { socket } from '../../socket/socketClient.js';
import type { CardPublic, CardColor } from '@signal/shared';

const colorBg: Record<string, string> = {
  red: 'bg-red-600 text-white border-red-500',
  blue: 'bg-blue-600 text-white border-blue-500',
  neutral: 'bg-gray-500 text-white border-gray-400',
  traitor: 'bg-gray-900 text-white border-gray-700',
};

const handlerTint: Record<string, string> = {
  red: 'ring-2 ring-red-400 ring-inset',
  blue: 'ring-2 ring-blue-400 ring-inset',
  neutral: 'ring-2 ring-gray-400 ring-inset',
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

  const baseClass = 'relative aspect-[4/3] rounded-lg border-2 flex items-center justify-center p-2 transition-all select-none';
  const fontClass = card.lang === 'th' ? 'font-thai' : '';
  const revealedClass = card.revealed && card.color ? colorBg[card.color] : 'bg-slate-700 border-slate-600 text-white';
  const handlerClass = !card.revealed && handlerColor ? handlerTint[handlerColor] : '';
  const cursorClass = canGuess ? 'cursor-pointer hover:brightness-125' : 'cursor-default';

  return (
    <button
      onClick={handleClick}
      disabled={!canGuess}
      aria-label={`${card.word}${card.revealed ? ` revealed as ${card.color}` : ''}`}
      role="button"
      className={`${baseClass} ${revealedClass} ${handlerClass} ${cursorClass} ${fontClass}`}
    >
      <span className="text-center font-bold text-sm break-all leading-tight" style={{ fontSize: 'clamp(0.7rem, 1.4vw, 1rem)' }}>
        {card.word}
      </span>
    </button>
  );
}
