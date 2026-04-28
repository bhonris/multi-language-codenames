# Signal — Feature Specification

> *"The universe is against us. We fight anyway."*
> — Hououin Kyouma, Future Gadget Lab

**Document status:** In progress
**Product name:** Signal
**Author:** Future Gadget Lab R&D Division
**Date:** 2026-04-28

---

## 1. Feature Description and Purpose

Signal is a real-time, browser-based word-association game for 2–8 players. Two teams take turns: one player per team (the **Handler**) gives single-word clues with a number, and the rest of that team's players (**Operatives**) attempt to identify which cards on a 5×5 board those clues refer to. Cards belong to Red, Blue, Neutral, or the special **TRAITOR** card — touching the TRAITOR card ends the game instantly for the team that touched it.

### The Differentiator

Every existing platform (including the official codenames.game, which already supports Thai) treats language as a per-game toggle. **Signal's unique value proposition is a mixed-language board**: English and Thai words appear side-by-side on the same 25-card grid within a single game. No existing platform does this.

Target audience: Thai friend groups ages 18–35, mixed Thai-expat groups, board game café regulars, and anyone operating in a bilingual Thai-English social context. This demographic is large, underserved, and already plays Codenames — they just have to choose one language or the other. Signal removes that choice.

Secondary differentiators:
- Integrated text chat visible to all players during the game (no other platform has this).
- Shareable room URL for instant invite (no account required).
- Quick-start flow: room is ready in under 30 seconds.
- Custom word packs (Thai slang, food, K-pop) as future expansion (out of scope for v1, but architecture must allow it).

---

## 2. Scope

### In Scope (v1)

- Real-time multiplayer game via WebSocket (Socket.IO).
- 5×5 board of 25 word cards drawn from active word lists.
- Language modes: English-only, Thai-only, Mixed (English + Thai words on the same board).
- Two teams: Red and Blue.
- Two roles: Handler (clue giver, sees all card colors) and Operative (sees only revealed cards).
- TRAITOR card mechanic: touching it ends the game for the touching team.
- Handler submits a clue (one word + number); Operatives click cards to guess.
- In-game text chat visible to all players.
- Room creation with a shareable 6-character alphanumeric code and URL (e.g., `signal.app/room/X4K9QZ`).
- No account or login required.
- Responsive layout for desktop and tablet (mobile playable but not primary target).
- English word list (~400 words) and Thai word list (~400 words).
- End-of-round and end-of-game state with winner announcement.
- Rematch (same players, new board) without leaving the room.

### Out of Scope (v1)

- Custom word packs (architecture must support them; UI and upload flow are not v1).
- User accounts, profiles, or persistent game history.
- Spectator mode (beyond passive observation via chat).
- Voice or video integration.
- Mobile-native app.
- Ranked/competitive matchmaking.
- More than two teams.
- Timer per turn (stretch goal only — not required for launch).
- Translations of the UI itself into Thai (UI is English-only in v1; only the *word cards* are multilingual).
- Any word list beyond English and Thai.
- AI/bot players.

---

## 3. User Stories

**Room management**

- As a player, I want to create a new game room and receive a shareable URL so that I can invite friends without them needing an account.
- As a player, I want to join an existing room by entering or clicking a room code so that I can play with friends who created the room.
- As a player, I want to choose a display name (no account required) so that teammates can identify me.

**Language selection**

- As a room creator, I want to choose English-only, Thai-only, or Mixed language mode before the game starts so that the word board matches my group's linguistic preference.
- As a player in a mixed Thai-expat group, I want English and Thai words to appear on the same board so that everyone can contribute clues and guesses regardless of their dominant language.

**Gameplay — Handler**

- As a Handler, I want to see the full color assignment of all 25 cards so that I can craft a clue that connects multiple cards of my team's color without revealing neutral or TRAITOR cards.
- As a Handler, I want to submit a one-word clue and a number so that my Operatives know how many cards to guess.
- As a Handler, I want the clue input to block me from entering a word that appears on the board so that I cannot accidentally cheat.

**Gameplay — Operative**

- As an Operative, I want to click a card to guess it so that the card flips and reveals its color assignment.
- As an Operative, I want to see my team's remaining card count so that I know how close we are to winning.
- As an Operative, I want to pass (end my team's turn without using all guesses) so that we don't risk over-guessing.

**TRAITOR card**

- As a player, I want the TRAITOR card to display the word "TRAITOR" so that when revealed, the losing condition is dramatically clear.
- As a team, I want clicking the TRAITOR card to immediately end the game and declare the opposing team the winner so that we pay a clear penalty for the mistake.

**Chat**

- As a player, I want to send short text messages visible to all players in the room so that we can react and trash-talk without leaving the app.

**End of game**

- As a player, I want to see a winner announcement overlay at the end of the game so that the result is unambiguous.
- As a player, I want a "Rematch" button that deals a new board with the same players and roles so that we can replay immediately.

---

## 4. Acceptance Criteria

- [ ] A player can create a room and receive a 6-character alphanumeric room code that, when entered by another player, places both in the same game session.
- [ ] The language selector offers exactly three options — English, Thai, Mixed — and is only changeable by the room creator before the game starts; changing it after game start is disabled.
- [ ] In Mixed mode, the 25-card board contains at least 5 Thai words and at least 5 English words drawn from their respective word lists; the exact split is randomized per game.
- [ ] Thai words on cards render in Noto Sans Thai or Sarabun font at a size readable at 1280×800 viewport without overflow or clipping.
- [ ] Exactly one player per team is designated Handler; that player's board view shows all 25 card color assignments overlaid on card text before any cards are revealed; Operative views show no color overlay on unrevealed cards.
- [ ] The TRAITOR card renders with the text "TRAITOR"; clicking it triggers an immediate game-over event that declares the opposing team the winner within 500 ms of the click (measured by the Socket.IO event reaching all connected clients).
- [ ] The Handler clue input field rejects (with an inline validation message) any submission where the clue word exactly matches (case-insensitive) any word currently on the board, including Thai words matched in their normalized form.
- [ ] An Operative can click "Pass Turn" at any time during their team's guessing phase; clicking it immediately ends the team's turn and switches active team, regardless of how many guesses remain.
- [ ] In-game text chat messages are broadcast to all clients in the room within 200 ms of submission under normal network conditions; messages persist for the duration of the room session.
- [ ] Clicking "Rematch" deals a new randomized 25-card board with fresh color assignments without disconnecting any player from the room; player names and team assignments are preserved.
- [ ] When a player disconnects and the room has fewer than 2 connected players, the game is paused (input disabled) and a "Waiting for players..." banner is shown; if the player reconnects within 60 seconds, the game resumes from the same state.
- [ ] The shareable room URL resolves directly to the join flow without requiring navigation; opening the URL in a new browser tab lands a user at the name-entry screen for that room code.
- [ ] Red team wins when all Red cards are revealed; Blue team wins when all Blue cards are revealed; each win condition is evaluated server-side after every card flip event and cannot be spoofed by a client.
- [ ] The game board layout is a 5-column CSS Grid; on viewports 768 px wide and above, all 25 cards are visible simultaneously without horizontal scrolling.

---

## 5. Architecture and Technical Design

### Overview

```
Browser (React + TypeScript + Vite)
        |
        |  WebSocket (Socket.IO)
        |  REST (room creation, word list meta)
        v
Node.js Backend (Express + Socket.IO)
        |
        |  In-memory store (development)
        |  Redis (production, optional v1)
        v
Word list files (flat .txt, one word per line, UTF-8)
```

No database is required for v1. All game state is held in server memory, keyed by room code. Word lists are loaded from disk at server startup and cached in memory.

### Frontend

| Concern | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Package manager | pnpm |
| Real-time client | socket.io-client |
| Styling | Tailwind CSS v3 |
| Fonts | Google Fonts: `Noto Sans Thai`, `Inter` |
| State management | Zustand (lightweight; no Redux overhead needed) |
| Routing | React Router v6 (two routes: `/` and `/room/:code`) |
| Testing | Vitest + React Testing Library |

### Backend

| Concern | Technology |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | Express 4 |
| WebSocket | Socket.IO 4 |
| Language | TypeScript (compiled via tsx for dev, tsc for prod) |
| In-memory store | Plain `Map<string, RoomState>` |
| Word lists | UTF-8 `.txt` files, one word per line |
| Testing | Vitest |

### Key Design Decisions

**Room state lives entirely on the server.** Clients receive a snapshot on join and receive incremental events (card flipped, turn changed, chat message, game over). Clients never compute win conditions — they only render what the server tells them. This prevents cheating and keeps the single source of truth clear.

**Handler vs. Operative views are enforced server-side.** When the server sends a `room:state` snapshot, it omits card color assignments for Operative clients. Handler clients receive the full color map. Clients cannot elevate their own role by crafting WebSocket messages because the server checks the player's role before emitting sensitive data.

**Word lists are flat UTF-8 text files** at `server/wordlists/en.txt` and `server/wordlists/th.txt`. Each file contains one word per line. At startup, the server reads both into arrays. Board generation samples from the appropriate list(s) without replacement. This architecture trivially supports new word packs: add a new `.txt` file and expose it through the language selector.

**Mixed-mode board generation:** Shuffle both arrays together, sample 25 with a guarantee of at least 5 from each language. Actual split is uniformly random between 5–20 from either language, subject to the minimum constraint.

**Room codes** are 6-character strings from the alphabet `A-Z0-9`, generated with `crypto.randomBytes` and checked for collision against the active room map. Probability of collision is negligible below 100k concurrent rooms.

**Room expiry:** Rooms with no connected clients for 30 minutes are deleted from memory.

### Project Structure

```
signal/
├── client/                  # Vite + React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Board/
│   │   │   │   ├── Board.tsx          # 5x5 grid
│   │   │   │   └── Card.tsx           # Individual card
│   │   │   ├── Chat/
│   │   │   │   └── ChatPanel.tsx
│   │   │   ├── Clue/
│   │   │   │   └── ClueInput.tsx      # Handler only
│   │   │   ├── Lobby/
│   │   │   │   ├── CreateRoom.tsx
│   │   │   │   └── JoinRoom.tsx
│   │   │   └── Overlay/
│   │   │       └── GameOverOverlay.tsx
│   │   ├── store/
│   │   │   └── gameStore.ts           # Zustand store
│   │   ├── socket/
│   │   │   └── socketClient.ts        # Socket.IO singleton
│   │   ├── types/
│   │   │   └── game.ts                # Shared type definitions
│   │   └── App.tsx
│   ├── index.html
│   └── vite.config.ts
├── server/
│   ├── src/
│   │   ├── index.ts                   # Express + Socket.IO bootstrap
│   │   ├── rooms/
│   │   │   ├── roomManager.ts         # Room CRUD, expiry
│   │   │   └── boardGenerator.ts      # Word sampling, color assignment
│   │   ├── handlers/
│   │   │   ├── joinHandler.ts
│   │   │   ├── gameHandler.ts         # Clue, guess, pass, rematch
│   │   │   └── chatHandler.ts
│   │   └── types/
│   │       └── game.ts                # Shared server-side types
│   └── wordlists/
│       ├── en.txt
│       └── th.txt
├── shared/
│   └── types.ts                       # Types shared between client and server
├── package.json                       # pnpm workspace root
└── pnpm-workspace.yaml
```

---

## 6. API Contract

### REST Endpoints

#### `POST /api/rooms`

Creates a new room. Called when a player clicks "Create Room."

**Request body:**
```json
{
  "displayName": "string (2–20 chars)",
  "language": "en" | "th" | "mixed"
}
```

**Response 201:**
```json
{
  "roomCode": "X4K9QZ",
  "playerId": "uuid-v4",
  "playerSecret": "uuid-v4"
}
```

`playerSecret` is a one-time token stored in `sessionStorage` used to authenticate reconnection. It is never transmitted over the WebSocket except during `player:reconnect`.

**Response 400:** `{ "error": "INVALID_DISPLAY_NAME" | "INVALID_LANGUAGE" }`

---

#### `GET /api/rooms/:code`

Returns lightweight room metadata for the join screen (does not require authentication).

**Response 200:**
```json
{
  "roomCode": "X4K9QZ",
  "language": "mixed",
  "playerCount": 3,
  "gamePhase": "lobby" | "playing" | "ended"
}
```

**Response 404:** `{ "error": "ROOM_NOT_FOUND" }`

---

### WebSocket Events

All WebSocket messages use Socket.IO's `emit(event, payload)` pattern. The server and client each emit and listen to distinct event namespaces.

#### Client → Server

| Event | Payload | Description |
|---|---|---|
| `player:join` | `{ roomCode, displayName, playerId?, playerSecret? }` | Join or rejoin a room. |
| `player:set-team` | `{ team: "red" \| "blue" }` | Player selects a team in lobby. |
| `player:set-role` | `{ role: "handler" \| "operative" }` | Player selects Handler role in lobby. |
| `game:start` | `{}` | Room creator starts the game (must have ≥2 players, 1 Handler per team). |
| `game:submit-clue` | `{ word: string, count: number }` | Handler submits clue. Validated server-side. |
| `game:guess` | `{ cardIndex: number }` | Operative guesses a card (0–24). |
| `game:pass` | `{}` | Operative passes remaining guesses. |
| `game:rematch` | `{}` | Any player requests a rematch after game ends. |
| `chat:message` | `{ text: string (max 200 chars) }` | Send a chat message. |

#### Server → Client (room-wide broadcasts unless noted)

| Event | Payload | Description |
|---|---|---|
| `room:state` | `RoomStateSnapshot` (see Data Design) | Full room snapshot. Sent on join and on rematch. Color map included only if recipient is Handler. |
| `room:player-joined` | `{ player: PublicPlayer }` | New player joined. |
| `room:player-left` | `{ playerId: string }` | Player disconnected. |
| `game:started` | `{ board: CardPublic[], firstTeam: "red" \| "blue" }` | Game has begun. Cards have no color assigned in this payload (Operatives use this). |
| `game:handler-board` | `{ board: CardFull[] }` | Sent only to Handler clients after game start. Includes color assignments. |
| `game:clue-submitted` | `{ word: string, count: number, team: "red" \| "blue" }` | Broadcast to all. |
| `game:card-revealed` | `{ cardIndex: number, color: "red" \| "blue" \| "neutral" \| "traitor", word: string }` | Broadcast to all after a guess. |
| `game:turn-changed` | `{ activeTeam: "red" \| "blue", guessesRemaining: number \| null }` | Signals new active team/turn. |
| `game:over` | `{ winner: "red" \| "blue", reason: "cards-cleared" \| "traitor-hit" }` | Game ended. |
| `game:rematched` | `RoomStateSnapshot` | New board issued for rematch; equivalent to `room:state`. |
| `chat:message` | `{ playerId: string, displayName: string, text: string, timestamp: number }` | Chat message broadcast. |
| `error` | `{ code: string, message: string }` | Per-client error (e.g., invalid clue, not your turn). |

---

## 7. Data and Storage Design

### Core Types (TypeScript, in `shared/types.ts`)

```typescript
type Language = "en" | "th" | "mixed";
type Team = "red" | "blue";
type Role = "handler" | "operative";
type CardColor = "red" | "blue" | "neutral" | "traitor";
type GamePhase = "lobby" | "playing" | "ended";

interface Player {
  id: string;           // UUID v4
  secret: string;       // UUID v4, never sent to other clients
  displayName: string;
  team: Team | null;
  role: Role;
  connected: boolean;
}

interface Card {
  index: number;        // 0–24
  word: string;
  lang: "en" | "th";
  color: CardColor;     // server only until revealed
  revealed: boolean;
}

// Sent to Operatives — color omitted if not revealed
interface CardPublic {
  index: number;
  word: string;
  lang: "en" | "th";
  color: CardColor | null;  // null if unrevealed
  revealed: boolean;
}

// Sent to Handlers — always includes color
interface CardFull extends Card {}

interface ClueRecord {
  word: string;
  count: number;
  team: Team;
  guessesUsed: number;
}

interface RoomState {
  code: string;
  language: Language;
  phase: GamePhase;
  players: Map<string, Player>;
  board: Card[];             // server-authoritative
  activeTeam: Team | null;
  guessesRemaining: number | null;
  currentClue: ClueRecord | null;
  clueHistory: ClueRecord[];
  redScore: number;          // cards remaining for Red to find
  blueScore: number;
  winner: Team | null;
  winReason: "cards-cleared" | "traitor-hit" | null;
  lastActivityAt: number;    // Unix ms, for expiry
  chatHistory: ChatMessage[];
}

interface ChatMessage {
  playerId: string;
  displayName: string;
  text: string;
  timestamp: number;
}
```

### Board Generation Algorithm

```
function generateBoard(language: Language): Card[]
  1. Load en_words[] and th_words[] from cache.
  2. If language === "en":  pool = shuffle(en_words).slice(0, 25)
     If language === "th":  pool = shuffle(th_words).slice(0, 25)
     If language === "mixed":
       n_th = random integer in [5, 20]
       n_en = 25 - n_th
       pool = [...shuffle(th_words).slice(0, n_th),
               ...shuffle(en_words).slice(0, n_en)]
       pool = shuffle(pool)
  3. Determine first team at random (Red or Blue).
  4. Assign colors:
       first team: 9 cards
       second team: 8 cards
       neutral: 7 cards
       traitor: 1 card
  5. Shuffle color assignments and zip with pool words.
  6. Set the TRAITOR card's word to "TRAITOR" (overrides sampled word).
  7. Return Card[] with revealed: false for all.
```

### Room Storage

In v1, all room state is held in a `Map<string, RoomState>` in the server process. A background interval every 5 minutes removes rooms where `lastActivityAt` is older than 30 minutes. There is no persistence across server restarts — this is acceptable for v1.

For production scaling, rooms can be migrated to Redis with minimal refactoring: `roomManager.ts` exports a `RoomStore` interface, and the in-memory implementation can be swapped for a Redis adapter without changing handlers.

### Word Lists

- `server/wordlists/en.txt` — ~400 common English nouns, one per line, UTF-8, no duplicates.
- `server/wordlists/th.txt` — ~400 Thai words appropriate for general audiences, one per line, UTF-8, no duplicates.
- Word lists are loaded once at startup: `const EN_WORDS: string[] = fs.readFileSync(...).split('\n').filter(Boolean)`.
- The word "TRAITOR" is excluded from both lists (the TRAITOR card's word is hardcoded, not sampled).

---

## 8. UI/UX Description

### Typography

- English words: `Inter` (sans-serif), weight 700, tracking wide.
- Thai words: `Noto Sans Thai` or `Sarabun`, weight 700. Both fonts loaded from Google Fonts with `font-display: swap`.
- Card font size: `clamp(0.85rem, 1.5vw, 1.1rem)` so long Thai words scale down rather than overflow.

### Layout

**Lobby screen (`/room/:code`, phase = lobby)**
- Top bar: room code with copy button, language badge.
- Player list: two columns (Red / Blue), each player as a chip with name and role badge (H = Handler, O = Operative).
- Language selector (dropdown, creator only): English / Thai / Mixed.
- "Start Game" button (creator only, enabled when each team has ≥1 Handler and ≥1 Operative).
- Shareable link: `Copy link` button.

**Game board (phase = playing)**
- **Header:** Red score (cards remaining) | active team indicator (pulsing border) | Blue score.
- **Board:** CSS Grid, 5 columns × 5 rows, equal card sizes. Cards are rectangular with word centered.
- **Card states:**
  - Unrevealed (Operative view): white/cream background, dark word text, subtle border.
  - Unrevealed (Handler view): same as Operative but overlaid with a faint color tint corresponding to team color (red tint for Red cards, blue tint for Blue, gray for Neutral, dark for TRAITOR). The color overlay uses 30% opacity so the word remains legible.
  - Revealed Red: solid red background, white text.
  - Revealed Blue: solid blue background, white text.
  - Revealed Neutral: gray background, muted text.
  - Revealed TRAITOR: black background, bold white "TRAITOR" text, skull icon optional.
- **Thai word cards** use `font-family: 'Noto Sans Thai', 'Sarabun', sans-serif`. English cards use `Inter`. Language is determined per-card by the `lang` field.
- **Clue panel (bottom, Handler only):** Text input for word, number picker (1–9 or ∞), Submit button. Disabled when not Handler's turn.
- **Active clue display (bottom, Operative view):** Shows current clue word and count. "Pass Turn" button.
- **Chat panel (right sidebar, all players):** Scrollable message list, input field, send button. Persistent throughout the game.

**Game over overlay**
- Full-screen semi-transparent overlay.
- Winner banner: "RED WINS" or "BLUE WINS" in large type with team color.
- Win reason: "Operatives cleared all cards" or "TRAITOR card touched."
- Board remains visible behind overlay (grayed out).
- "Rematch" button (available to all players).

### Responsive Behavior

- ≥1280 px: Board + Chat side-by-side.
- 768–1279 px: Board full width; Chat collapsed to a toggleable drawer.
- <768 px: Cards shrink to fit; Chat is a floating button that opens a modal. Functional but not the primary target.

### Accessibility

- Cards have `role="button"` and `aria-label` including word and revealed state.
- Color is never the sole differentiator: revealed cards include team name as accessible text.
- Focus styles are visible (2 px outline).

---

## 9. Edge Cases and Error Handling

| Scenario | Handling |
|---|---|
| Player submits a clue word that matches a board word | Server rejects with `error` event `{ code: "CLUE_MATCHES_BOARD" }`. Client shows inline message under input. |
| Player submits a clue number of 0 | Allowed (means "guess as many as you want," unlimited guesses for the turn). Rendered as "∞" in UI. |
| Player tries to guess when it is not their team's turn | Server rejects with `error` event `{ code: "NOT_YOUR_TURN" }`. No board state changes. |
| Non-Handler player tries to submit a clue | Server rejects with `{ code: "NOT_HANDLER" }`. |
| Player tries to reveal an already-revealed card | Server ignores the event silently (idempotent). |
| Room creator disconnects before game starts | Next-joined player becomes the room creator (room creator flag transferred). |
| Handler disconnects mid-turn | Their team's turn continues; Operatives can still pass. If the Handler has not yet submitted a clue, the turn is blocked — Operatives see "Waiting for Handler..." until Handler reconnects or a 60 s timeout passes, after which the turn automatically passes. |
| All players on one team disconnect | Game is paused. State preserved for 30 minutes per room expiry rule. |
| Room code does not exist | `GET /api/rooms/:code` returns 404; client shows "Room not found" and a "Create a new room" link. |
| Word list file missing at startup | Server throws and refuses to start; startup error is logged with the missing file path. |
| More than one Handler per team tries to set their role | Second player's `player:set-role` to Handler is rejected with `{ code: "HANDLER_ALREADY_TAKEN" }`. |
| Chat message exceeds 200 characters | Server truncates to 200 characters before broadcasting (no error; silent truncation). |
| Rematch requested while some players are disconnected | Game starts with connected players only; disconnected players are removed from teams. |
| Mixed mode word list has fewer than 5 words in one language | Server falls back to the language with more words and emits a warning log. Should not occur with properly sized word lists. |

---

## 10. Testing Strategy

### Unit Tests (Vitest)

- `boardGenerator.ts`: verify 25 cards generated, correct color counts (9/8/7/1), TRAITOR card present, mixed mode contains ≥5 of each language, no duplicate words on a single board.
- `roomManager.ts`: room creation, join, player role assignment, room expiry, reconnect logic.
- Handler validation: clue word matches board word (exact and case-insensitive), clue number bounds.
- Win condition evaluation: red-win, blue-win, traitor-hit.
- `RoomStore` interface: unit-test the in-memory adapter, ensuring the Redis adapter can be tested against the same contract.

### Integration Tests (Vitest + supertest + Socket.IO test client)

- Full game flow: create room → join → set teams → start game → submit clue → guess cards → win.
- TRAITOR card hit: game ends, correct winner declared.
- Reconnect: player disconnects, reconnects within 60 s, receives correct state snapshot.
- Chat: message sent by player A is received by player B in the same room.
- Turn enforcement: Operative on wrong team cannot guess; rejected event received.
- Language modes: Mixed board always satisfies the ≥5 per language constraint across 100 random boards (property-based style).

### Frontend Component Tests (Vitest + React Testing Library)

- `Card.tsx`: renders word, renders revealed state, calls guess handler on click, does not call handler if already revealed.
- `ClueInput.tsx`: disables submit when word matches board word, enables when valid.
- `Board.tsx`: renders 25 cards in a 5-column grid.
- `ChatPanel.tsx`: new message appears in list after submission.
- `GameOverOverlay.tsx`: displays correct winner text and rematch button.

### Manual QA Checklist

- Open two browsers, create and join same room, complete a full game.
- Verify Handler color overlay is visible only in Handler tab.
- Verify Thai words render without clipping on 1280×800 Chrome.
- Verify Mixed board contains both languages.
- Trigger TRAITOR card; verify game ends correctly.
- Test chat during active gameplay.
- Paste room URL into incognito tab; verify join flow.
- Disconnect a player mid-game; verify "Waiting for players..." banner; reconnect.

### Coverage Target

95% line coverage across `server/src/` and `client/src/` as required by project conventions. CI fails on coverage below this threshold.

---

## 11. Open Questions

1. **Word list curation:** Who curates the Thai word list? Are there words that are culturally sensitive, slang, or ambiguous that should be excluded? Do we need a review pass by a native Thai speaker before launch?

2. **Mixed mode split UX:** Should the UI tell players what the language split is (e.g., "14 English / 11 Thai") or is that an unfair hint? (Current spec: not disclosed.)

3. **Handler disconnection timeout:** 60 seconds before auto-pass is a guess. Should this be shorter (30 s) to prevent games from stalling, or is 60 s more forgiving?

4. **Font loading on slow connections:** Should Thai font be bundled (increases bundle size ~500 KB) or loaded from Google Fonts (CDN risk in some regions)? Self-hosting may be better for Thai users on slower connections.

5. **Room code reuse:** After a room expires (30 min inactivity), should its code be eligible for reuse? Collision is very unlikely but worth deciding explicitly. Current design: yes, codes are reused.

6. **Rematch role persistence:** On rematch, are team assignments preserved but roles re-randomized, or does everything persist? Current spec: teams and roles persist. Is that the right default?

7. **Clue number = 0 ("unlimited"):** Some Codenames variants forbid this. Should Signal allow it? Current spec: allowed, rendered as ∞.

8. **Spectator mode:** Not in v1 scope, but it would only require a third role type and a server-side view filter. When should this be built?

9. **Deployment target:** No deployment target specified. Does this affect any v1 architecture decisions (e.g., sticky sessions for Socket.IO vs. Redis adapter)?

10. **Turn timer:** The spec marks this as stretch-only. If added, what is the default duration and is it per-clue (Handler's thinking time) or per-guess (Operative's time)?

---

## 12. Todo List

- [ ] Finalize and seed English word list (400 words, no duplicates, no "TRAITOR")
- [ ] Source and review Thai word list with native speaker approval
- [ ] Set up pnpm workspace with `client/` and `server/` packages
- [ ] Scaffold Vite + React + TypeScript client
- [ ] Scaffold Express + Socket.IO + TypeScript server
- [ ] Implement `boardGenerator.ts` with unit tests
- [ ] Implement `roomManager.ts` with unit tests
- [ ] Implement all Socket.IO event handlers with integration tests
- [ ] Implement REST endpoints (`POST /api/rooms`, `GET /api/rooms/:code`)
- [ ] Build Lobby UI (player list, team/role assignment, language selector)
- [ ] Build Board component (5×5 grid, card states, Handler overlay)
- [ ] Build ClueInput component with board-word validation
- [ ] Build ChatPanel component
- [ ] Build GameOverOverlay component
- [ ] Integrate Google Fonts: Inter + Noto Sans Thai
- [ ] Per-card font family switching based on `card.lang`
- [ ] Shareable URL join flow (navigate to `/room/:code`, prompt for name)
- [ ] Reconnect logic (sessionStorage secret, 60 s grace window)
- [ ] Room expiry background job
- [ ] Configure CI with test + coverage gate (≥95%)
- [ ] Manual QA pass on Chrome, Firefox, Safari
- [ ] Accessibility audit (keyboard navigation, screen reader spot check)
