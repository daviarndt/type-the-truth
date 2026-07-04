// Sons de teclado sintetizados via Web Audio (sem arquivos de áudio).
// Baseados em ruído filtrado (soam como teclas de verdade, não bipes).
// Pequena variação de tom por tecla evita o efeito "robótico".

import type { KeySoundId } from "./db";

export const KEY_SOUNDS: KeySoundId[] = ["off", "soft", "mechanical", "clicky", "typewriter", "pop"];

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;
let master: GainNode | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function getNoise(c: AudioContext): AudioBuffer {
  if (noise) return noise;
  const len = Math.floor(c.sampleRate * 0.25);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  noise = buf;
  return buf;
}

const rand = (base: number, spread: number) => base + (Math.random() * 2 - 1) * spread;

/** Burst de ruído filtrado — o "corpo" de um toque de tecla. */
function noiseBurst(
  c: AudioContext,
  out: AudioNode,
  opts: { type: BiquadFilterType; freq: number; q?: number; gain: number; decay: number; delay?: number }
) {
  const t = c.currentTime + (opts.delay ?? 0);
  const src = c.createBufferSource();
  src.buffer = getNoise(c);
  src.playbackRate.value = rand(1, 0.06);
  const filter = c.createBiquadFilter();
  filter.type = opts.type;
  filter.frequency.value = rand(opts.freq, opts.freq * 0.06);
  if (opts.q) filter.Q.value = opts.q;
  const g = c.createGain();
  g.gain.setValueAtTime(opts.gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + opts.decay);
  src.connect(filter).connect(g).connect(out);
  src.start(t);
  src.stop(t + opts.decay + 0.02);
}

/** Componente tonal (senoide/triângulo) com queda de tom — dá "graves"/"ping". */
function tone(
  c: AudioContext,
  out: AudioNode,
  opts: { type: OscillatorType; from: number; to: number; gain: number; decay: number; delay?: number }
) {
  const t = c.currentTime + (opts.delay ?? 0);
  const osc = c.createOscillator();
  osc.type = opts.type;
  osc.frequency.setValueAtTime(rand(opts.from, opts.from * 0.04), t);
  osc.frequency.exponentialRampToValueAtTime(opts.to, t + opts.decay);
  const g = c.createGain();
  g.gain.setValueAtTime(opts.gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + opts.decay);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + opts.decay + 0.02);
}

export function playKeySound(id: KeySoundId): void {
  if (id === "off") return;
  const c = getCtx();
  if (!c || !master) return;

  switch (id) {
    // Toque suave e discreto — o que menos incomoda
    case "soft":
      noiseBurst(c, master, { type: "lowpass", freq: 1300, gain: 0.05, decay: 0.035 });
      break;

    // "Thock" de teclado mecânico com o-ring — cheio e satisfatório
    case "mechanical":
      noiseBurst(c, master, { type: "lowpass", freq: 900, q: 1.2, gain: 0.11, decay: 0.055 });
      tone(c, master, { type: "sine", from: 190, to: 110, gain: 0.09, decay: 0.05 });
      break;

    // Switch "clicky" — clack curto e brilhante
    case "clicky":
      noiseBurst(c, master, { type: "bandpass", freq: 2600, q: 1.1, gain: 0.09, decay: 0.028 });
      noiseBurst(c, master, { type: "highpass", freq: 3200, gain: 0.05, decay: 0.02 });
      break;

    // Máquina de escrever — batida + "ping" metálico
    case "typewriter":
      noiseBurst(c, master, { type: "bandpass", freq: 1800, q: 0.8, gain: 0.1, decay: 0.03 });
      tone(c, master, { type: "triangle", from: 2600, to: 2000, gain: 0.045, decay: 0.06, delay: 0.008 });
      tone(c, master, { type: "sine", from: 150, to: 90, gain: 0.06, decay: 0.04 });
      break;

    // "Pop" arredondado e macio — tonal, mas agradável (nada de bipe quadrado)
    case "pop":
      tone(c, master, { type: "sine", from: 760, to: 320, gain: 0.12, decay: 0.06 });
      noiseBurst(c, master, { type: "lowpass", freq: 1600, gain: 0.03, decay: 0.02 });
      break;
  }
}
