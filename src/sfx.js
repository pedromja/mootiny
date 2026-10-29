// Sons sintetizados com WebAudio (sem ficheiros de áudio, sem direitos de autor).
import { SAVE, persist } from './save.js';

export const PACKS = ['classico', 'mootiny', 'silencio'];
export const PACK_LABEL = { classico: 'Clássico', mootiny: 'Mootiny', silencio: 'Silêncio' };

export const Sfx = {
  ctx: null,
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  cyclePack() {
    const i = PACKS.indexOf(SAVE.soundPack);
    SAVE.soundPack = PACKS[(i + 1) % PACKS.length];
    persist();
    this.play('coin');
    return SAVE.soundPack;
  },
  tone(freq, dur, type = 'square', vol = 0.06, slideTo = null, delay = 0) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.05);
  },
  moo(delay = 0, pitch = 1) {
    this.tone(150 * pitch, 0.25, 'sawtooth', 0.07, 120 * pitch, delay);
    this.tone(120 * pitch, 0.45, 'sawtooth', 0.06, 90 * pitch, delay + 0.2);
  },
  play(name) {
    const pack = SAVE.soundPack;
    if (pack === 'silencio') return;
    const silly = pack === 'mootiny';
    switch (name) {
      case 'jump': silly ? this.tone(260, 0.18, 'sawtooth', 0.05, 520) : this.tone(330, 0.14, 'square', 0.05, 660); break;
      case 'djump': silly ? this.moo(0, 1.6) : this.tone(520, 0.14, 'square', 0.05, 1040); break;
      case 'coin': this.tone(880, 0.07, silly ? 'triangle' : 'square', 0.04); this.tone(1320, 0.12, silly ? 'triangle' : 'square', 0.04, null, 0.07); break;
      case 'stomp': silly ? this.tone(900, 0.2, 'square', 0.06, 90) : this.tone(220, 0.14, 'sawtooth', 0.07, 70); break;
      case 'hurt': this.tone(320, 0.3, 'sawtooth', 0.07, 90); break;
      case 'fall': this.tone(700, 0.55, 'sine', 0.07, 90); break;
      case 'plop': this.tone(110, 0.22, 'sine', 0.2, 480); this.tone(600, 0.1, 'triangle', 0.08, 1200, 0.16); break;
      case 'power': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.07, null, i * 0.09)); break;
      case 'check': this.tone(660, 0.1, 'triangle', 0.06); this.tone(990, 0.16, 'triangle', 0.06, null, 0.1); break;
      case 'moo': this.moo(0, silly ? 1.3 : 1); break;
      case 'win': [392, 523, 659, 784, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.07, null, i * 0.12)); if (silly) this.moo(0.9); break;
      case 'dash': silly ? this.tone(200, 0.22, 'sawtooth', 0.06, 1400) : this.tone(300, 0.18, 'square', 0.05, 1200); break;
      case 'zap': this.tone(1800, 0.12, 'sawtooth', 0.04, 600); break;
      case 'boom': this.tone(90, 0.6, 'sawtooth', 0.12, 30); this.tone(60, 0.8, 'square', 0.08, 25, 0.1); break;
      case 'boss': this.tone(110, 0.35, 'square', 0.07, 70); this.tone(82, 0.5, 'square', 0.07, 55, 0.3); break;
      case 'hit': this.tone(1200, 0.08, 'square', 0.07); this.tone(400, 0.3, 'sawtooth', 0.08, 120, 0.06); break;
      case 'click': this.tone(600, 0.05, 'square', 0.04); break;
    }
  },
};

const unlock = () => Sfx.unlock();
['pointerdown', 'touchstart', 'keydown'].forEach((ev) => window.addEventListener(ev, unlock, { passive: true }));
