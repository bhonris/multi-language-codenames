import { Routes, Route } from 'react-router-dom';
import LobbyPage from './pages/LobbyPage.js';
import RoomPage from './pages/RoomPage.js';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LobbyPage />} />
      <Route path="/room/:code" element={<RoomPage />} />
    </Routes>
  );
}
