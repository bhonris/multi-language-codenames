# Bug Fixes & UI Improvements

## Feature Specification

A batch of gameplay bug fixes combined with UI/UX improvements to make Signal more polished, responsive, and informative. Covers three verified server-side bugs, responsive layout issues, sound feedback, a game event history, and a handler-change flow on rematch.

---

## Scope & Out of Scope

**In scope:**
- Fix traitor card word replacement bug
- Fix starting-team / card-count mismatch
- Fix rematch card-counter reset on client
- Constrain board layout so it never overflows the viewport
- Visual polish (card styles, animations, color palette)
- Sound alerts via Web Audio API
- Game history panel (clues, guesses, key events)
- Allow handler change on rematch (expose existing role-change flow)

**Out of scope:**
- Changing the 9/8/7/1 card distribution
- Persistent game history across page reloads
- Adding new word packs or editing existing ones
- Spectator mode

---

## Bug Analysis

### Bug 1 — Traitor card word replaced with literal "TRAITOR"

**Location:** `server/src/domain/boardGenerator.ts:25`

```ts
word: color === 'traitor' ? 'TRAITOR' : entry.word,
```

This replaces the actual random word with the string `"TRAITOR"`, so **every player** (not just handlers) can see which unrevealed card is the death card. Handlers already get a yellow ring indicator — they don't need the word changed. Operatives should not be able to identify the traitor card before it's guessed.

**Fix:** Remove the replacement — always use `entry.word`.

---

### Bug 2 — Starting team card count mismatch

**Location:** `server/src/domain/boardGenerator.ts:18` and `server/src/socket/handlers/gameHandlers.ts:27, 145`

`generateBoard()` rolls its own random `firstTeam` internally and passes it to `assignColors()` — this is what determines which color gets 9 cards vs 8. Then, independently, `gameHandlers.ts` rolls *another* random `firstTeam` for `room.game.activeTeam`. Because these are two separate `Math.random()` calls, they can (and often will) disagree.

Example: board gives red 9 cards; handler picks blue as first team → blue starts but only has 8 cards.

**Fix:** `generateBoard()` returns `{ board: Card[], firstTeam: Team }`. Game handlers consume the returned `firstTeam` instead of rolling their own.

---

### Bug 3 — Rematch does not reset client-side counters

**Location:** `client/src/socket/socketHandlers.ts` + `client/src/store/gameStore.ts`

On rematch the server sends three events in sequence:
1. `game:started(board)` → `setOperativeBoard(board)` — only updates `board` and flips `phase` to `'playing'`
2. `game:handler-board(board)` → `setHandlerBoard(board)` — only updates `handlerBoard`
3. `game:turn-changed(team, null)` → `setTurn(...)` — only updates `activeTeam` / `guessesRemaining`

None of these events carries the new `redRemaining`/`blueRemaining` values. The client's score counters therefore show the stale counts from the previous game.

**Fix:** Extend `game:started` to carry an initial state object `{ redRemaining, blueRemaining, firstTeam }`. Update shared event types and the client handler accordingly.

---

## User Stories

- As an operative, I want unrevealed cards to show only the word — not "TRAITOR" — so I cannot identify the death card by reading.
- As a handler, I want the board to correctly tell me which team starts (the one with 9 cards), so I know how to prioritise my clues.
- As a player after a rematch, I want the score counters to show the new board's correct values immediately, without confusion from the previous round.
- As a player, I want the UI to fit my screen without scrolling or overflow, across desktop and mobile sizes.
- As a player, I want audio cues when cards are revealed, turns change, or the game ends, so I am not caught off-guard.
- As a player, I want a history panel that shows every clue, guess result, and turn change so I can review what happened.
- As a handler who wants to step down after a game, I want to change my role in the rematch screen before a new round begins.

---

## Acceptance Criteria

1. **Traitor word:** All 25 cards always show their random word; the string "TRAITOR" never appears on any card face. Handlers still see a yellow ring on the traitor card.
2. **Starting team counts:** The team whose `activeTeam` is set on game start always has exactly 9 unrevealed cards; the other team always has 8.
3. **Rematch counters:** Immediately after a rematch begins, `redRemaining` and `blueRemaining` in the score bar reflect the new board — not the previous game's final values.
4. **Board layout:** The 5×5 board fits within the visible viewport on all screen sizes without vertical overflow or horizontal scrollbar.
5. **Sound alerts:** Distinct sounds play on: card reveal (correct team / wrong team / neutral / traitor), clue submitted, turn change, game over.
6. **History panel:** A scrollable history panel visible during gameplay shows, in order: every clue given (word + count + team), every guess (card word + result), turn changes, and game-over events.
7. **Change handler:** The game-over overlay includes a "Change Role" control that lets any player on their team become the handler before rematch is triggered. The change is broadcast live so other players see it.

---

## Architecture & Technical Design

### Server Changes

**`server/src/domain/boardGenerator.ts`**
- Remove `color === 'traitor' ? 'TRAITOR' : entry.word` replacement
- Change return type to `{ board: Card[]; firstTeam: Team }`
- Export new return type

**`server/src/socket/handlers/gameHandlers.ts`**
- Update `game:start` and `game:rematch` to destructure `{ board, firstTeam }` from `generateBoard()`
- Remove the independent `Math.random()` firstTeam roll
- On `game:started` emission: pass a second argument `{ redRemaining, blueRemaining, firstTeam }`

**`packages/shared/src/events/server-events.ts`**
- Change: `'game:started': (board: CardPublic[], state: GameStartState) => void`
- Add type `GameStartState = { redRemaining: number; blueRemaining: number; firstTeam: Team }`

### Client Changes

**`client/src/socket/socketHandlers.ts`**
- Update `game:started` handler to call `store().setOperativeBoard(board, state)`

**`client/src/store/gameStore.ts`**
- `setOperativeBoard(board, state)` — also sets `game.redRemaining`, `game.blueRemaining`, `game.firstTeam`
- Add `gameHistory: GameEvent[]` to state with `addHistoryEvent(event: GameEvent)` action

**New `client/src/audio/soundManager.ts`**
- Web Audio API oscillator/buffer based sounds (no external dependencies)
- Exports: `playSound(type: SoundType)` where `SoundType = 'correct' | 'wrong' | 'neutral' | 'traitor' | 'clue' | 'turn' | 'win' | 'lose'`
- Called from `socketHandlers.ts` on relevant events

**New `client/src/components/game/HistoryPanel.tsx`**
- Reads `gameHistory` from store
- Scrollable, newest-at-bottom
- Color-coded rows: red/blue/neutral/traitor for guesses; team-colored for clues

**Updated `client/src/components/game/GameView.tsx`**
- Fixed-height layout: use `h-screen` with `overflow-hidden` outer; board column uses `flex-1 min-h-0 overflow-auto`
- Sidebar: tabs for Chat / History

**Updated `client/src/components/game/WordCard.tsx`**
- Richer card styles: gradient backgrounds on revealed cards, scale-up animation on reveal, glow on hover when guessable
- Font improvements

**Updated `client/src/components/game/Board.tsx`**
- `aspect-[5/4]` constraint on the grid wrapper so it never overflows

**Updated `client/src/components/game/GameOverOverlay.tsx`**
- Add a "Switch to Handler / Operative" toggle for the player's own role (emits `player:set-role`)
- Shows the updated role live before rematch is triggered

---

## API Contract

### Modified: `game:started` (server → client)

**Before:**
```ts
'game:started': (board: CardPublic[]) => void
```

**After:**
```ts
'game:started': (board: CardPublic[], state: { redRemaining: number; blueRemaining: number; firstTeam: Team }) => void
```

No other event contract changes. `player:set-role` already exists and works during `'ended'` phase (no server changes needed for the change-handler feature).

---

## Security Considerations

- No server-side changes to authorization logic.
- The `player:set-role` endpoint already validates team membership.
- Sound is client-only and requires no API calls.

---

## Performance Considerations

- Web Audio API oscillators are created on-demand and disconnected immediately after play — no memory leaks.
- Game history is stored only in memory (Zustand) and is capped at 200 entries to avoid unbounded growth.

---

## Edge Cases & Error Handling

| Case | Handling |
|---|---|
| Rematch while a player has no team | Role change not shown for them in overlay |
| Both players want to be handler | Existing `setPlayerRole` validation already prevents two handlers per team |
| Sound blocked by browser autoplay policy | `AudioContext.resume()` called on first user interaction; failure is silenced |
| `game:started` arrives before `room:state` | Defensive guard: if `game` is null in store, initialise from state arg |

---

## Testing Strategy

- **Unit tests:** `boardGenerator` — verify firstTeam returned matches board distribution; verify no card word is 'TRAITOR'.
- **Integration tests:** Full `game:start` and `game:rematch` socket flows — assert `activeTeam` matches the team with 9 cards.
- **Integration tests:** Rematch flow — assert client counters match new board after rematch event sequence.
- **Manual:** Sound in browser (can't be automated); history panel scrolling and content accuracy.

---

## Todo List

### Server
- [x] `boardGenerator.ts`: remove 'TRAITOR' word replacement; return `{ board, firstTeam }`
- [x] `gameHandlers.ts`: consume `firstTeam` from `generateBoard()`; extend `game:started` emission
- [x] `server-events.ts` (shared): add `GameStartState` type; update `game:started` signature

### Client
- [x] `socketHandlers.ts`: update `game:started` handler signature
- [x] `gameStore.ts`: update `setOperativeBoard`; add history state + `addHistoryEvent`
- [x] Create `client/src/audio/soundManager.ts`
- [x] Wire sound calls in `socketHandlers.ts`
- [x] Create `client/src/components/game/HistoryPanel.tsx`
- [x] Create `client/src/components/game/Sidebar.tsx` (Chat/History tabs)
- [x] `GameView.tsx`: fix layout height / overflow; add History tab
- [x] `WordCard.tsx`: visual polish (gradients, animations, hover glow)
- [x] `Board.tsx`: constrain aspect ratio / max height via grid-rows-5
- [x] `GameOverOverlay.tsx`: add Change Role controls
- [x] `ScoreBar.tsx`: minor polish (show which team has 9 vs 8 on first turn indicator)

### Tests
- [x] Update `boardGenerator` tests
- [x] Update `gameHandlers` integration tests for start + rematch
- [x] Add regression test: firstTeam has 9 cards on board
