import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function LobbyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefillCode: string = (location.state as any)?.joinCode ?? '';
  const [displayName, setDisplayName] = useState('');
  const [language, setLanguage] = useState<'en' | 'th' | 'mixed'>('en');
  const [joinCode, setJoinCode] = useState(prefillCode);
  const [mode, setMode] = useState<'create' | 'join'>(prefillCode ? 'join' : 'create');
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (displayName.trim().length < 2) { setError('Name must be at least 2 characters'); return; }
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: displayName.trim(), language }),
    });
    if (!res.ok) { setError('Failed to create room'); return; }
    const { roomCode, playerId } = await res.json();
    sessionStorage.setItem('playerId', playerId);
    sessionStorage.setItem('displayName', displayName.trim());
    navigate(`/room/${roomCode}`);
  };

  const handleJoin = () => {
    if (displayName.trim().length < 2) { setError('Name must be at least 2 characters'); return; }
    if (joinCode.trim().length !== 6) { setError('Room code must be 6 characters'); return; }
    sessionStorage.setItem('displayName', displayName.trim());
    navigate(`/room/${joinCode.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl p-8 w-full max-w-md shadow-2xl">
        <h1 className="text-4xl font-black text-center mb-2 tracking-widest text-white">SIGNAL</h1>
        <p className="text-slate-400 text-center mb-8 text-sm">A word-association game</p>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setMode('create')} className={`flex-1 py-2 rounded-lg font-bold transition-colors ${mode === 'create' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Create Room</button>
          <button onClick={() => setMode('join')} className={`flex-1 py-2 rounded-lg font-bold transition-colors ${mode === 'join' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>Join Room</button>
        </div>

        <input
          type="text"
          placeholder="Your display name"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          maxLength={20}
          className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 mb-4 outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {mode === 'create' && (
          <select value={language} onChange={e => setLanguage(e.target.value as 'en' | 'th' | 'mixed')} className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 mb-4 outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="en">English only</option>
            <option value="th">Thai only / ภาษาไทย</option>
            <option value="mixed">Mixed (EN + TH)</option>
          </select>
        )}

        {mode === 'join' && (
          <input
            type="text"
            placeholder="Room code (6 characters)"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 mb-4 outline-none focus:ring-2 focus:ring-indigo-500 tracking-widest font-mono text-center"
          />
        )}

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <button
          onClick={mode === 'create' ? handleCreate : handleJoin}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-colors"
        >
          {mode === 'create' ? 'Create Room' : 'Join Room'}
        </button>
      </div>
    </div>
  );
}
