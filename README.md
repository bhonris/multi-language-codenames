# Signal

A real-time multiplayer word-association game inspired by Codenames, with support for mixed English/Thai word boards.

## Requirements

- [Node.js](https://nodejs.org/) 18 or later
- [pnpm](https://pnpm.io/) — install with `npm install -g pnpm`

## Quick start (development)

```bash
# 1. Install dependencies
pnpm install

# 2. Start client + server in parallel
pnpm dev
```

Open **http://localhost:5173** in your browser. The backend runs on port 3001; the Vite dev server proxies `/api` and `/socket.io` automatically.

## Play on your local network (LAN)

The server binds to all interfaces, so anyone on the same Wi-Fi can join.

1. Find your machine's local IP (e.g. `192.168.1.42`)
2. Share `http://192.168.1.42:5173` with other players
3. One player creates a room; others join using the 6-character room code

## Production build

```bash
# Build everything and start the server (serves the client too)
pnpm start
```

The built client is served statically from the backend on port 3001. No separate web server needed.

## How to play

### Roles

Each team has two roles:

| Role | What they do |
|---|---|
| **Handler** | Sees all card colors. Gives one-word clues each turn. |
| **Operative** | Does not see card colors. Guesses cards based on the clue. |

### Setup

1. One player clicks **Create Room** and shares the room code.
2. All players join and pick a team (Red or Blue).
3. Each team designates one player as **Handler**; the rest are **Operatives**.
4. The room creator clicks **Start Game**.

### Game rules

- The starting team always has **9 cards**; the other team has **8**. The score bar shows which team goes first.
- Each turn, the active Handler types a one-word clue and a number (how many cards it relates to).
- Operatives click cards to guess. They get one bonus guess on top of the clue number.
- Revealing a card shows its color:
  - **Your team's color** — keep guessing or pass
  - **Opponent's color** — turn immediately passes to the other team
  - **Neutral (gray)** — turn ends
  - **Traitor (yellow ring)** — game over, other team wins instantly
- The first team to reveal all their cards wins.

### Language options

| Option | Description |
|---|---|
| English only | All 25 words drawn from the English word pack (~480 words) |
| Thai only | All 25 words drawn from the Thai word pack (~400 words) |
| Mixed (EN + TH) | At least 5 words from each language, randomly mixed |

### After a game

- Click **Rematch** to start a new round with the same players (new board, random starting team).
- Use the **Switch to Handler / Operative** toggle in the game-over screen to change your role before the rematch.

## Commands

All commands run from the repo root.

```bash
pnpm dev            # Start dev servers (client + server in parallel)
pnpm build          # Build all packages
pnpm start          # Build then serve in production mode
pnpm test           # Run all tests
pnpm test:coverage  # Run tests with coverage report
pnpm typecheck      # TypeScript type-check all packages
```

## Project structure

```
codenames/
├── client/          # React 18 + TypeScript + Vite + Tailwind
├── server/          # Node.js + Express + Socket.IO
└── packages/
    └── shared/      # Shared TypeScript types and Socket.IO event definitions
```
