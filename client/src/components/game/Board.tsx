import { useGameStore } from '../../store/gameStore.js';
import WordCard from './WordCard.js';

export default function Board() {
  const board = useGameStore(s => s.board);
  const handlerBoard = useGameStore(s => s.handlerBoard);

  return (
    <div className="grid grid-cols-5 gap-2 w-full" data-testid="game-board">
      {board.map((card, i) => (
        <WordCard
          key={card.index}
          card={card}
          handlerColor={handlerBoard?.[i]?.color ?? null}
        />
      ))}
    </div>
  );
}
