export type SoundType = 'correct' | 'wrong' | 'neutral' | 'traitor' | 'clue' | 'turn' | 'win' | 'lose';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.25, delay = 0) {
  try {
    const context = getCtx();
    const osc = context.createOscillator();
    const gainNode = context.createGain();
    osc.connect(gainNode);
    gainNode.connect(context.destination);
    osc.type = type;
    osc.frequency.value = freq;
    const start = context.currentTime + delay;
    gainNode.gain.setValueAtTime(0, start);
    gainNode.gain.linearRampToValueAtTime(gain, start + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  } catch {
    // AudioContext unavailable or blocked
  }
}

export function playSound(type: SoundType): void {
  try {
    switch (type) {
      case 'correct':
        tone(523, 0.12);           // C5
        tone(659, 0.18, 'sine', 0.25, 0.1); // E5
        break;
      case 'wrong':
        tone(300, 0.25, 'sawtooth', 0.2);
        tone(220, 0.3, 'sawtooth', 0.15, 0.1);
        break;
      case 'neutral':
        tone(392, 0.2, 'sine', 0.2);
        break;
      case 'traitor':
        tone(110, 0.4, 'sawtooth', 0.4);
        tone(82, 0.6, 'square', 0.3, 0.15);
        tone(55, 0.8, 'sawtooth', 0.2, 0.3);
        break;
      case 'clue':
        tone(700, 0.08, 'sine', 0.2);
        tone(880, 0.12, 'sine', 0.15, 0.08);
        break;
      case 'turn':
        tone(440, 0.1, 'sine', 0.2);
        tone(550, 0.15, 'sine', 0.2, 0.12);
        break;
      case 'win':
        tone(523, 0.15, 'sine', 0.3);
        tone(659, 0.15, 'sine', 0.3, 0.15);
        tone(784, 0.15, 'sine', 0.3, 0.3);
        tone(1047, 0.3, 'sine', 0.3, 0.45);
        break;
      case 'lose':
        tone(392, 0.2, 'sine', 0.25);
        tone(330, 0.2, 'sine', 0.2, 0.2);
        tone(262, 0.4, 'sine', 0.2, 0.4);
        break;
    }
  } catch {
    // ignore all audio errors
  }
}
