import { useState } from 'react';
import ChatPanel from '../chat/ChatPanel.js';
import HistoryPanel from './HistoryPanel.js';

export default function Sidebar() {
  const [tab, setTab] = useState<'chat' | 'history'>('chat');

  return (
    <div className="lg:w-80 w-full flex flex-col gap-2 lg:h-full min-h-64">
      <div className="flex gap-1 bg-slate-800 rounded-xl p-1 shrink-0">
        <button
          onClick={() => setTab('chat')}
          className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${
            tab === 'chat' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Chat
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors ${
            tab === 'history' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          History
        </button>
      </div>
      <div className="flex-1 min-h-0">
        {tab === 'chat' ? <ChatPanel /> : <HistoryPanel />}
      </div>
    </div>
  );
}
