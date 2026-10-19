let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  return audioCtx;
}

function playTone(
  freq: number,
  startOffset: number,
  duration: number,
  type: OscillatorType,
  peakGain: number
) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const start = ctx.currentTime + startOffset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peakGain, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Pitch-bent tone (glides from freqStart to freqEnd), used for sweeps like a "sad trombone". */
function playSweep(
  freqStart: number,
  freqEnd: number,
  startOffset: number,
  duration: number,
  type: OscillatorType,
  peakGain: number
) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const start = ctx.currentTime + startOffset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, start);
  osc.frequency.exponentialRampToValueAtTime(freqEnd, start + duration);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peakGain, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Game-show-style "win" fanfare: a sparkling ascending run landing on a bright chord. */
export function playCorrectSound() {
  const run = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5 E5 G5 C6 E6
  run.forEach((freq, i) => playTone(freq, i * 0.055, 0.14, "triangle", 0.15));

  const landStart = run.length * 0.055;
  [1046.5, 1318.51, 1567.98, 2093].forEach(
    (freq) => playTone(freq, landStart, 0.45, "sine", 0.16) // C6 E6 G6 C7
  );
  [1046.5, 1318.51, 1567.98].forEach(
    (freq) => playTone(freq, landStart, 0.45, "triangle", 0.08)
  );
}

/** Game-show-style "wrong" sound: a harsh buzzer followed by a descending "sad trombone". */
export function playIncorrectSound() {
  playTone(146.83, 0, 0.22, "sawtooth", 0.16); // D3 buzzer
  playTone(138.59, 0, 0.22, "square", 0.08); // dissonant layer

  playSweep(196, 164.81, 0.26, 0.3, "sawtooth", 0.13); // G3 -> E3 womp
  playSweep(174.61, 130.81, 0.58, 0.4, "sawtooth", 0.13); // F3 -> C3 womp
}

/** Reads text aloud in French using the browser's built-in speech synthesis. */
export function speakText(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
}
