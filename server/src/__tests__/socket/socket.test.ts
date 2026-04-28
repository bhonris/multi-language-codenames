import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { createTestServer, connectClient, waitFor, type TestClient } from './helpers.js';
import { clearAllRooms } from '../../rooms/roomStore.js';

let port: number;
let cleanup: () => Promise<void>;

beforeAll(async () => {
  ({ port, cleanup } = await createTestServer());
});

afterAll(async () => {
  await cleanup();
});

beforeEach(() => clearAllRooms());

async function createRoom(lang = 'en', name = 'Creator') {
  const app = createApp();
  const res = await request(app).post('/api/rooms').send({ displayName: name, language: lang });
  return res.body as { roomCode: string; playerId: string };
}

async function joinRoom(client: TestClient, roomCode: string, displayName: string) {
  const stateP = waitFor<any>(client, 'room:state');
  client.connect();
  client.emit('player:join', { roomCode, displayName });
  return stateP;
}

async function setupAndStartGame(roomCode: string) {
  // Four players: red handler + operative, blue handler + operative
  const redHandler = connectClient(port);
  const redOp = connectClient(port);
  const blueHandler = connectClient(port);
  const blueOp = connectClient(port);

  await joinRoom(redHandler, roomCode, 'RedHandler'); // first join = creator
  await joinRoom(redOp, roomCode, 'RedOp');
  await joinRoom(blueHandler, roomCode, 'BlueHandler');
  await joinRoom(blueOp, roomCode, 'BlueOp');

  const setTeamRole = async (client: TestClient, team: 'red' | 'blue', role: 'handler' | 'operative') => {
    const teamP = waitFor(client, 'room:player-updated');
    client.emit('player:set-team', team);
    await teamP;
    const roleP = waitFor(client, 'room:player-updated');
    client.emit('player:set-role', role);
    await roleP;
  };

  await setTeamRole(redHandler, 'red', 'handler');
  await setTeamRole(redOp, 'red', 'operative');
  await setTeamRole(blueHandler, 'blue', 'handler');
  await setTeamRole(blueOp, 'blue', 'operative');

  const redBoardP = waitFor<any[]>(redHandler, 'game:handler-board');
  const blueBoardP = waitFor<any[]>(blueHandler, 'game:handler-board');
  const startedP = waitFor(redHandler, 'game:started');
  const turnP = waitFor<any[]>(redHandler, 'game:turn-changed');
  redHandler.emit('game:start');
  await startedP;
  const [firstTeam] = await turnP;
  const handlerBoard = firstTeam === 'red' ? await redBoardP : await blueBoardP;

  const activeHandler = firstTeam === 'red' ? redHandler : blueHandler;
  const activeOp = firstTeam === 'red' ? redOp : blueOp;
  const inactiveHandler = firstTeam === 'red' ? blueHandler : redHandler;
  const inactiveOp = firstTeam === 'red' ? blueOp : redOp;
  const allClients = [redHandler, redOp, blueHandler, blueOp];

  return { activeHandler, activeOp, inactiveHandler, inactiveOp, firstTeam, handlerBoard, allClients, redHandler, redOp, blueHandler, blueOp };
}

// ─── room handlers ─────────────────────────────────────────────────────────

describe('socket: player:join', () => {
  it('emits room:state after joining a valid room', async () => {
    const { roomCode } = await createRoom();
    const client = connectClient(port);
    const state = await joinRoom(client, roomCode, 'Alice');
    expect(state.code).toBe(roomCode);
    expect(state.players).toHaveLength(1);
    client.disconnect();
  });

  it('emits error for unknown room', async () => {
    const client = connectClient(port);
    const errP = waitFor<any[]>(client, 'error');
    client.connect();
    client.emit('player:join', { roomCode: 'XXXXXX', displayName: 'Alice' });
    const err = await errP;
    expect(err[0]).toBe('ROOM_NOT_FOUND');
    client.disconnect();
  });

  it('emits error for short display name', async () => {
    const { roomCode } = await createRoom();
    const client = connectClient(port);
    const errP = waitFor<any[]>(client, 'error');
    client.connect();
    client.emit('player:join', { roomCode, displayName: 'A' });
    const err = await errP;
    expect(err[0]).toBe('INVALID_NAME');
    client.disconnect();
  });

  it('broadcasts room:player-joined to existing players', async () => {
    const { roomCode } = await createRoom();
    const client1 = connectClient(port);
    const client2 = connectClient(port);
    await joinRoom(client1, roomCode, 'Alice');
    const joinedP = waitFor<any>(client1, 'room:player-joined');
    await joinRoom(client2, roomCode, 'Bob');
    const joined = await joinedP;
    expect(joined.displayName).toBe('Bob');
    client1.disconnect();
    client2.disconnect();
  });
});

describe('socket: player:set-team and player:set-role', () => {
  it('updates team via player:set-team', async () => {
    const { roomCode } = await createRoom();
    const client = connectClient(port);
    await joinRoom(client, roomCode, 'Alice');
    const updatedP = waitFor<any>(client, 'room:player-updated');
    client.emit('player:set-team', 'red');
    const updated = await updatedP;
    expect(updated.team).toBe('red');
    client.disconnect();
  });

  it('sets handler role after joining team', async () => {
    const { roomCode } = await createRoom();
    const client = connectClient(port);
    await joinRoom(client, roomCode, 'Alice');
    const teamP = waitFor(client, 'room:player-updated');
    client.emit('player:set-team', 'red');
    await teamP;
    const roleP = waitFor<any>(client, 'room:player-updated');
    client.emit('player:set-role', 'handler');
    const updated = await roleP;
    expect(updated.role).toBe('handler');
    client.disconnect();
  });

  it('emits error if no team before setting role', async () => {
    const { roomCode } = await createRoom();
    const client = connectClient(port);
    await joinRoom(client, roomCode, 'Alice');
    const errP = waitFor<any[]>(client, 'error');
    client.emit('player:set-role', 'handler');
    const err = await errP;
    expect(err[0]).toBe('NO_TEAM');
    client.disconnect();
  });
});

describe('socket: disconnect', () => {
  it('emits room:player-left when player disconnects', async () => {
    const { roomCode } = await createRoom();
    const client1 = connectClient(port);
    const client2 = connectClient(port);
    await joinRoom(client1, roomCode, 'Alice');
    await joinRoom(client2, roomCode, 'Bob');
    const leftP = waitFor<string>(client1, 'room:player-left');
    client2.disconnect();
    const leftId = await leftP;
    expect(typeof leftId).toBe('string');
    client1.disconnect();
  });
});

// ─── game handlers ──────────────────────────────────────────────────────────

describe('socket: game:start', () => {
  it('starts game and emits game:started (25 cards) to all players', async () => {
    const { roomCode } = await createRoom();
    const handler = connectClient(port);
    const operative = connectClient(port);
    await joinRoom(handler, roomCode, 'Handler');
    await joinRoom(operative, roomCode, 'Operative');
    const teamH = waitFor(handler, 'room:player-updated');
    handler.emit('player:set-team', 'red');
    await teamH;
    const roleH = waitFor(handler, 'room:player-updated');
    handler.emit('player:set-role', 'handler');
    await roleH;
    const teamO = waitFor(operative, 'room:player-updated');
    operative.emit('player:set-team', 'blue');
    await teamO;

    const startedH = waitFor<any>(handler, 'game:started');
    const startedO = waitFor<any>(operative, 'game:started');
    const handlerBoard = waitFor<any>(handler, 'game:handler-board');
    handler.emit('game:start');
    const [[boardH, stateH], [boardO], fullBoard] = await Promise.all([startedH, startedO, handlerBoard]);

    expect(boardH).toHaveLength(25);
    expect(boardO).toHaveLength(25);
    expect(fullBoard.every((c: any) => c.color !== null)).toBe(true);
    expect(stateH.redRemaining + stateH.blueRemaining).toBe(17);
    // The firstTeam must have exactly 9 cards
    const firstTeamCount = fullBoard.filter((c: any) => c.color === stateH.firstTeam).length;
    expect(firstTeamCount).toBe(9);

    handler.disconnect();
    operative.disconnect();
  });

  it('rejects game:start from non-creator', async () => {
    const { roomCode } = await createRoom();
    const handler = connectClient(port);
    const operative = connectClient(port);
    await joinRoom(handler, roomCode, 'Handler');
    await joinRoom(operative, roomCode, 'Operative');

    const errP = waitFor<any[]>(operative, 'error');
    operative.emit('game:start');
    const err = await errP;
    expect(err[0]).toBe('NOT_CREATOR');

    handler.disconnect();
    operative.disconnect();
  });
});

describe('socket: game:submit-clue', () => {
  it('active handler submits a valid clue', async () => {
    const { roomCode } = await createRoom();
    const { activeHandler, allClients } = await setupAndStartGame(roomCode);

    const clueP = waitFor<any[]>(activeHandler, 'game:clue-submitted');
    activeHandler.emit('game:submit-clue', 'NOTAWORD99999', 2);
    const clue = await clueP;
    expect(clue[0]).toBe('NOTAWORD99999');
    expect(clue[1]).toBe(2);

    allClients.forEach(c => c.disconnect());
  });

  it('rejects clue from operative', async () => {
    const { roomCode } = await createRoom();
    const { activeOp, allClients } = await setupAndStartGame(roomCode);

    const errP = waitFor<any[]>(activeOp, 'error');
    activeOp.emit('game:submit-clue', 'APPLE', 1);
    const err = await errP;
    expect(err[0]).toBe('NOT_HANDLER');

    allClients.forEach(c => c.disconnect());
  });
});

describe('socket: game:pass', () => {
  it('active operative passes turn to other team', async () => {
    const { roomCode } = await createRoom();
    const { activeHandler, activeOp, allClients } = await setupAndStartGame(roomCode);

    activeHandler.emit('game:submit-clue', 'ZXQWORD', 1);
    await waitFor(activeHandler, 'game:clue-submitted');

    const turn2 = waitFor<any[]>(activeHandler, 'game:turn-changed');
    activeOp.emit('game:pass');
    const [nextTeam] = await turn2;
    expect(['red', 'blue'].includes(nextTeam)).toBe(true);

    allClients.forEach(c => c.disconnect());
  });
});

describe('socket: game:guess', () => {
  it('rejects guess from handler (NOT_OPERATIVE)', async () => {
    const { roomCode } = await createRoom();
    const { activeHandler, allClients } = await setupAndStartGame(roomCode);

    activeHandler.emit('game:submit-clue', 'NOTAWORD99999', 1);
    await waitFor(activeHandler, 'game:clue-submitted');

    const errP = waitFor<any[]>(activeHandler, 'error');
    activeHandler.emit('game:guess', 0);
    const err = await errP;
    expect(err[0]).toBe('NOT_OPERATIVE');
    allClients.forEach(c => c.disconnect());
  });

  it('rejects guess with no active clue (NO_CLUE)', async () => {
    const { roomCode } = await createRoom();
    const { activeOp, allClients } = await setupAndStartGame(roomCode);

    const errP = waitFor<any[]>(activeOp, 'error');
    activeOp.emit('game:guess', 0);
    const err = await errP;
    expect(err[0]).toBe('NO_CLUE');
    allClients.forEach(c => c.disconnect());
  });

  it('rejects guess from inactive team operative (NOT_YOUR_TURN)', async () => {
    const { roomCode } = await createRoom();
    const { activeHandler, inactiveOp, allClients } = await setupAndStartGame(roomCode);

    activeHandler.emit('game:submit-clue', 'NOTAWORD99999', 1);
    await waitFor(activeHandler, 'game:clue-submitted');

    const errP = waitFor<any[]>(inactiveOp, 'error');
    inactiveOp.emit('game:guess', 0);
    const err = await errP;
    expect(err[0]).toBe('NOT_YOUR_TURN');
    allClients.forEach(c => c.disconnect());
  });

  it('rejects already-revealed card (INVALID_CARD)', async () => {
    const { roomCode } = await createRoom();
    const { activeHandler, activeOp, handlerBoard, firstTeam, allClients } = await setupAndStartGame(roomCode);

    const ownCard = handlerBoard.find((c: any) => c.color === firstTeam)!;
    activeHandler.emit('game:submit-clue', 'NOTAWORD99999', 2);
    await waitFor(activeHandler, 'game:clue-submitted');

    activeOp.emit('game:guess', ownCard.index);
    await waitFor(activeOp, 'game:turn-changed');

    const errP = waitFor<any[]>(activeOp, 'error');
    activeOp.emit('game:guess', ownCard.index);
    const err = await errP;
    expect(err[0]).toBe('INVALID_CARD');
    allClients.forEach(c => c.disconnect());
  });

  it('operative guesses own-team card — stays active with decremented guesses', async () => {
    const { roomCode } = await createRoom();
    const { activeHandler, activeOp, handlerBoard, firstTeam, allClients } = await setupAndStartGame(roomCode);

    const ownCard = handlerBoard.find((c: any) => c.color === firstTeam)!;
    activeHandler.emit('game:submit-clue', 'NOTAWORD99999', 2);
    await waitFor(activeHandler, 'game:clue-submitted');

    const revealedP = waitFor<any[]>(activeOp, 'game:card-revealed');
    const turnP = waitFor<any[]>(activeOp, 'game:turn-changed');
    activeOp.emit('game:guess', ownCard.index);
    const [, color] = await revealedP;
    expect(color).toBe(firstTeam);
    const [, guessesRemaining] = await turnP;
    expect(guessesRemaining).toBe(2);
    allClients.forEach(c => c.disconnect());
  });

  it('operative guesses neutral card — turn passes to other team', async () => {
    const { roomCode } = await createRoom();
    const { activeHandler, activeOp, handlerBoard, firstTeam, allClients } = await setupAndStartGame(roomCode);

    const neutralCard = handlerBoard.find((c: any) => c.color === 'neutral')!;
    activeHandler.emit('game:submit-clue', 'NOTAWORD99999', 1);
    await waitFor(activeHandler, 'game:clue-submitted');

    const turnP = waitFor<any[]>(activeOp, 'game:turn-changed');
    activeOp.emit('game:guess', neutralCard.index);
    const [nextTeam] = await turnP;
    const otherTeam = firstTeam === 'red' ? 'blue' : 'red';
    expect(nextTeam).toBe(otherTeam);
    allClients.forEach(c => c.disconnect());
  });

  it('operative hits TRAITOR card — game ends with traitor-hit', async () => {
    const { roomCode } = await createRoom();
    const { activeHandler, activeOp, handlerBoard, allClients } = await setupAndStartGame(roomCode);

    const traitorCard = handlerBoard.find((c: any) => c.color === 'traitor')!;
    activeHandler.emit('game:submit-clue', 'NOTAWORD99999', 1);
    await waitFor(activeHandler, 'game:clue-submitted');

    const overP = waitFor<any[]>(activeOp, 'game:over');
    activeOp.emit('game:guess', traitorCard.index);
    const [, reason] = await overP;
    expect(reason).toBe('traitor-hit');
    allClients.forEach(c => c.disconnect());
  });
});

describe('socket: game:rematch', () => {
  it('rejects rematch while game is still playing', async () => {
    const { roomCode } = await createRoom();
    const { activeHandler, allClients } = await setupAndStartGame(roomCode);

    const errP = waitFor<any[]>(activeHandler, 'error');
    activeHandler.emit('game:rematch');
    const err = await errP;
    expect(err[0]).toBe('GAME_NOT_ENDED');

    allClients.forEach(c => c.disconnect());
  });

  it('starts rematch after game ends (traitor hit)', async () => {
    const { roomCode } = await createRoom();
    const { activeHandler, activeOp, handlerBoard, allClients } = await setupAndStartGame(roomCode);

    const traitorCard = handlerBoard.find((c: any) => c.color === 'traitor')!;
    activeHandler.emit('game:submit-clue', 'NOTAWORD99999', 1);
    await waitFor(activeHandler, 'game:clue-submitted');
    activeOp.emit('game:guess', traitorCard.index);
    await waitFor(activeHandler, 'game:over');

    const startedP = waitFor<any>(activeHandler, 'game:started');
    activeHandler.emit('game:rematch');
    const [board, state] = await startedP;
    expect(board).toHaveLength(25);
    expect(state.redRemaining + state.blueRemaining).toBe(17);
    allClients.forEach(c => c.disconnect());
  });
});

// ─── chat handlers ──────────────────────────────────────────────────────────

describe('socket: chat', () => {
  it('broadcasts chat message to all room members', async () => {
    const { roomCode } = await createRoom();
    const client1 = connectClient(port);
    const client2 = connectClient(port);
    await joinRoom(client1, roomCode, 'Alice');
    await joinRoom(client2, roomCode, 'Bob');

    const msgP = waitFor<any>(client2, 'chat:message');
    client1.emit('chat:message', 'Hello world');
    const msg = await msgP;
    expect(msg.text).toBe('Hello world');
    expect(msg.displayName).toBe('Alice');

    client1.disconnect();
    client2.disconnect();
  });

  it('truncates chat messages over 200 chars', async () => {
    const { roomCode } = await createRoom();
    const client = connectClient(port);
    await joinRoom(client, roomCode, 'Alice');

    const msgP = waitFor<any>(client, 'chat:message');
    client.emit('chat:message', 'x'.repeat(300));
    const msg = await msgP;
    expect(msg.text.length).toBe(200);

    client.disconnect();
  });

  it('does not broadcast whitespace-only message', async () => {
    const { roomCode } = await createRoom();
    const client1 = connectClient(port);
    const client2 = connectClient(port);
    await joinRoom(client1, roomCode, 'Alice');
    await joinRoom(client2, roomCode, 'Bob');

    let received = false;
    client2.on('chat:message', () => { received = true; });
    client1.emit('chat:message', '   ');
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(received).toBe(false);

    client1.disconnect();
    client2.disconnect();
  });
});

// ─── room:set-language ────────────────────────────────────────────────────────

describe('socket: room:set-language', () => {
  it('creator can change language in lobby', async () => {
    const { roomCode } = await createRoom('en');
    const creator = connectClient(port);
    const observer = connectClient(port);
    await joinRoom(creator, roomCode, 'Creator');
    await joinRoom(observer, roomCode, 'Observer');

    const changedP = waitFor<any>(observer, 'room:language-changed');
    creator.emit('room:set-language', 'th');
    const lang = await changedP;
    expect(lang).toBe('th');

    creator.disconnect();
    observer.disconnect();
  });

  it('non-creator cannot change language', async () => {
    const { roomCode } = await createRoom('en');
    const creator = connectClient(port);
    const other = connectClient(port);
    await joinRoom(creator, roomCode, 'Creator');
    await joinRoom(other, roomCode, 'Other');

    let changed = false;
    creator.on('room:language-changed', () => { changed = true; });
    other.emit('room:set-language', 'th');
    await new Promise(r => setTimeout(r, 80));
    expect(changed).toBe(false);

    creator.disconnect();
    other.disconnect();
  });
});

// ─── reconnect ───────────────────────────────────────────────────────────────

describe('socket: reconnect via playerSecret', () => {
  it('restores player to same id when reconnecting with secret', async () => {
    const { roomCode } = await createRoom();
    const client = connectClient(port);
    const state = await joinRoom(client, roomCode, 'Alice');
    const { myPlayerId, myPlayerSecret } = state;

    client.disconnect();
    await new Promise(r => setTimeout(r, 50));

    const newClient = connectClient(port);
    const reconnectStateP = waitFor<any>(newClient, 'room:state');
    newClient.connect();
    newClient.emit('player:join', { roomCode, displayName: 'Alice', playerSecret: myPlayerSecret });
    const reconnectState = await reconnectStateP;

    expect(reconnectState.myPlayerId).toBe(myPlayerId);
    newClient.disconnect();
  });

  it('emits game:paused when connected count drops below 2 during playing', async () => {
    const { roomCode } = await createRoom();
    const { activeHandler, activeOp, inactiveHandler, inactiveOp, allClients } = await setupAndStartGame(roomCode);

    const pausedP = waitFor<boolean>(activeHandler, 'game:paused');
    // disconnect 3 players so only 1 remains
    activeOp.disconnect();
    inactiveHandler.disconnect();
    inactiveOp.disconnect();
    const paused = await pausedP;
    expect(paused).toBe(true);

    activeHandler.disconnect();
    for (const c of allClients) { try { c.disconnect(); } catch {} }
  });

  it('emits game:paused false when a new player joins and count reaches 2', async () => {
    const { roomCode } = await createRoom();
    const { activeHandler, activeOp, inactiveHandler, inactiveOp, allClients } = await setupAndStartGame(roomCode);

    // Disconnect 3 players so game pauses
    const pausedP = waitFor<boolean>(activeHandler, 'game:paused');
    activeOp.disconnect();
    inactiveHandler.disconnect();
    inactiveOp.disconnect();
    await pausedP;

    // Join a new player to bring connected count to 2 → game resumes
    const rejoiner = connectClient(port);
    const resumedP = waitFor<boolean>(activeHandler, 'game:paused');
    joinRoom(rejoiner, roomCode, 'NewPlayer');
    const resumed = await resumedP;
    expect(resumed).toBe(false);

    activeHandler.disconnect();
    rejoiner.disconnect();
    for (const c of allClients) { try { c.disconnect(); } catch {} }
  });
});
