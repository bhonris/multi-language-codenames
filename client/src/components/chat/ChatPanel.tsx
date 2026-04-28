import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore.js';
import { socket } from '../../socket/socketClient.js';

export default function ChatPanel() {
  const messages = useGameStore(s => s.chatMessages);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    socket.emit('chat:message', t);
    setText('');
  };

  return (
    <div className="bg-slate-800 rounded-xl flex flex-col h-full min-h-64 lg:min-h-0 lg:h-full">
      <div className="px-4 py-3 border-b border-slate-700 font-bold text-slate-300 text-sm">Chat</div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 max-h-72 lg:max-h-none">
        {messages.map(m => (
          <div key={m.id}>
            <span className="text-indigo-400 font-bold text-xs">{m.displayName}: </span>
            <span className="text-slate-300 text-sm">{m.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="px-4 py-3 border-t border-slate-700 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Message…"
          maxLength={200}
          className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button onClick={send} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg transition-colors text-sm font-bold">↑</button>
      </div>
    </div>
  );
}
