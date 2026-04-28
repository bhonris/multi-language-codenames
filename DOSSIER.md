# codenames_online — Future Gadget Dossier

## What this is
Signal is a real-time, browser-based word-association game (inspired by the Codenames board game mechanic) for 2–8 players. Its unique differentiator: **mixed-language boards** where English and Thai words appear side-by-side on the same 25-card grid. No existing platform does this. Two teams (Red/Blue) take turns with a Handler giving one-word clues and Operatives guessing cards — touching the TRAITOR card ends the game instantly. Built with React + TypeScript + Vite (client) and Node.js + Express + Socket.IO (server), using pnpm workspaces.

## Current status
Phase: worldline-selection (Leap 0/30, Cycle 1)
Divergence meter: 0%

## Stack
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS + Zustand
- Backend: Node.js 20 + Express 4 + Socket.IO 4 + TypeScript
- Package manager: pnpm (workspace monorepo)
- Testing: Vitest + React Testing Library
- Word lists: flat UTF-8 .txt files (en.txt, th.txt)

## Acceptance Criteria — Cycle 1
- [ ] A player can create a room and receive a 6-character alphanumeric room code that, when entered by another player, places both in the same game session.
- [ ] The language selector offers exactly three options — English, Thai, Mixed — and is only changeable by the room creator before the game starts.
- [ ] In Mixed mode, the 25-card board contains at least 5 Thai words and at least 5 English words.
- [ ] Thai words on cards render in Noto Sans Thai or Sarabun font at a size readable at 1280×800 viewport without overflow or clipping.
- [ ] Exactly one player per team is designated Handler; Handler's board view shows all 25 card color assignments; Operative views show no color overlay on unrevealed cards.
- [ ] The TRAITOR card renders with the text "TRAITOR"; clicking it triggers an immediate game-over event within 500 ms.
- [ ] The Handler clue input field rejects any submission where the clue word exactly matches any word on the board (case-insensitive, including Thai).
- [ ] An Operative can click "Pass Turn" to immediately end the team's turn.
- [ ] In-game text chat messages are broadcast to all clients within 200 ms of submission.
- [ ] Clicking "Rematch" deals a new randomized 25-card board without disconnecting any player.
- [ ] When a player disconnects and fewer than 2 connected players remain, the game is paused with a "Waiting for players..." banner.
- [ ] The shareable room URL resolves directly to the join flow without requiring navigation.
- [ ] Red team wins when all Red cards are revealed; Blue team wins when all Blue cards are revealed; win conditions evaluated server-side.
- [ ] The game board layout is a 5-column CSS Grid; on viewports ≥768 px, all 25 cards are visible simultaneously without horizontal scrolling.

## Lab Members engaged
- Faris NyanNyan (market research — identified mixed-language boards as the key differentiator)
- Okabe / Hououin Kyouma (spec author)
