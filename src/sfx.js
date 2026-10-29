// Som "Muu-lah Pop": efeitos (pacotes Clássico/Mootiny) + música em loop. Silêncio = nada toca.
// Os ficheiros vêm de public/assets/audio (.ogg primeiro, .mp3 para Safari/iOS).
import { SAVE, persist } from './save.js';

export const PACKS = ['classico', 'mootiny', 'silencio'];
export const PACK_LABEL = { classico: 'Clássico', mootiny: 'Mootiny', silencio: 'Silêncio' };
export const SFX_KEYS = ['jump', 'djump', 'dash', 'coin', 'stomp', 'hurt', 'fall', 'check', 'power', 'beam', 'plop', 'zap', 'boom', 'boss_hit', 'boss_defeat', 'win', 'moo', 'ui_click'];
// nomes antigos → novos
const ALIAS = { click: 'ui_click', boss: 'boss_hit', hit: 'boss_hit' };
const MUSIC = { theme: 'music_theme', boss: 'music_boss' };

let game = null;
const mgr = () => (game ? game.sound : null);
const ready = () => { const m = mgr(); return !!m && !m.locked && !(m.context && m.context.state !== 'running'); };

export const Music = {
  want: null, // 'theme' | 'boss' | null
  cur: null,
  play(track) { this.want = track; this.refresh(); },
  stop() { this.want = null; this.refresh(); },
  refresh() {
    const m = mgr();
    if (!m) return;
    const key = SAVE.soundPack !== 'silencio' && this.want ? MUSIC[this.want] : null;
    if (this.cur && (!key || this.cur.key !== key)) { this.cur.stop(); this.cur.destroy(); this.cur = null; }
    if (!key || this.cur || !game.cache.audio.exists(key)) return;
    if (!ready()) { if (!this.waiting) { this.waiting = true; m.once('unlocked', () => { this.waiting = false; this.refresh(); }); } return; }
    this.cur = m.add(key, { loop: true, volume: 0.35 });
    this.cur.play();
  },
};

export const Sfx = {
  init(g) { game = g; },
  unlock() { const m = mgr(); if (m && m.context && m.context.state === 'suspended') m.context.resume().catch(() => {}); },
  cyclePack() {
    const i = PACKS.indexOf(SAVE.soundPack);
    SAVE.soundPack = PACKS[(i + 1) % PACKS.length];
    persist();
    Music.refresh();
    this.play('coin');
    return SAVE.soundPack;
  },
  play(name, opts = {}) {
    const pack = SAVE.soundPack;
    if (pack === 'silencio' || !ready()) return;
    const key = `${pack}_${ALIAS[name] || name}`;
    if (!game.cache.audio.exists(key)) return;
    game.sound.play(key, { volume: 0.7, ...opts });
  },
};
