// audio.js — every sound in the game is synthesized with WebAudio, so the game
// ships no sound files at all. A tiny helper builds short tones and noise bursts.

export function createAudio() {
  let ctx = null;
  const api = {
    // unlock must run from a user gesture at least once (browsers gate audio).
    unlock() {
      if (!ctx) {
        try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
      }
      if (ctx && ctx.state === 'suspended') void ctx.resume();
    },
    tone(freq, seconds, type, volume, slideTo) {
      if (!ctx) return;
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + seconds);
      gain.gain.setValueAtTime(volume || 0.12, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + seconds + 0.02);
    },
    noise(seconds, volume, lowpass) {
      if (!ctx) return;
      const t0 = ctx.currentTime;
      const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = lowpass || 1200;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume || 0.1, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
      src.connect(filter).connect(gain).connect(ctx.destination);
      src.start(t0);
    },
    footstep(sneaking) { api.noise(0.07, sneaking ? 0.02 : 0.06, 500); },
    coin() { api.tone(1900, 0.12, 'triangle', 0.14, 1500); },
    pickup() { api.tone(660, 0.12, 'sine', 0.14); setTimeout(() => api.tone(990, 0.18, 'sine', 0.14), 90); },
    spotted() { api.tone(220, 0.35, 'sawtooth', 0.16, 440); api.noise(0.25, 0.08, 900); },
    caught() { api.tone(180, 0.6, 'sawtooth', 0.18, 60); },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => api.tone(f, 0.25, 'triangle', 0.14), i * 110));
    },
    door() { api.tone(330, 0.2, 'sine', 0.1, 520); },
  };
  return api;
}
