// GHOSTLIGHT — all sound, synthesized live with WebAudio.
// One file, one job: footsteps, stings, chimes and the ambient loop.
// No audio files: every sound is an oscillator or filtered noise.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.musicTimer = null;
    this.musicStep = 0;
    this.enabled = true;
  }

  /** Create the context on the first user gesture (browsers require it). */
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone(freq, dur, type = 'sine', vol = 0.12, when = 0, slideTo = null) {
    if (!this.ctx || !this.enabled) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noise(dur, vol = 0.08, freq = 800, when = 0) {
    if (!this.ctx || !this.enabled) return;
    const t0 = this.ctx.currentTime + when;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = freq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(gain).connect(this.ctx.destination);
    src.start(t0);
  }

  footstep(sneak) {
    this.noise(0.06, sneak ? 0.02 : 0.05, sneak ? 400 : 700);
  }

  pickup() {
    this.tone(880, 0.12, 'sine', 0.1);
    this.tone(1318, 0.18, 'sine', 0.08, 0.07);
  }

  coin() {
    this.tone(1567, 0.1, 'triangle', 0.07);
  }

  suspicious() {
    this.tone(220, 0.35, 'triangle', 0.1, 0, 330);
  }

  alarm() {
    this.tone(196, 0.22, 'sawtooth', 0.09, 0, 392);
    this.tone(196, 0.22, 'sawtooth', 0.09, 0.24, 392);
  }

  caught() {
    this.tone(311, 0.5, 'sawtooth', 0.12, 0, 98);
    this.noise(0.4, 0.08, 300, 0.05);
  }

  win() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.25, 'sine', 0.09, i * 0.11));
  }

  exitOpen() {
    this.tone(392, 0.15, 'sine', 0.08);
    this.tone(587, 0.3, 'sine', 0.08, 0.1);
  }

  /** A slow, quiet minor-key loop: one soft note per beat, bass underneath. */
  startMusic() {
    if (!this.ctx || this.musicTimer) return;
    const scale = [220, 261.6, 293.7, 329.6, 392, 440];
    this.musicTimer = setInterval(() => {
      if (!this.enabled) return;
      const note = scale[this.musicStep % scale.length];
      this.tone(note, 0.9, 'sine', 0.035);
      if (this.musicStep % 4 === 0) this.tone(110, 1.4, 'sine', 0.03);
      this.musicStep++;
    }, 620);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}
