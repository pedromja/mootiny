// Gravação local (localStorage), sem contas.
const KEY = 'mootiny.save.v1';
const W = () => ({ done: false, bestClovers: 0, bestTime: null });
const DEFAULTS = { doubleJump: false, dash: false, easy: false, introSeen: false, soundPack: 'classico', world1: W(), world2: W() };

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY)) || {};
    return { ...DEFAULTS, ...s, world1: { ...W(), ...(s.world1 || {}) }, world2: { ...W(), ...(s.world2 || {}) } };
  } catch {
    return JSON.parse(JSON.stringify(DEFAULTS));
  }
}

export const SAVE = load();
export function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(SAVE)); } catch { /* armazenamento indisponível */ }
}
export const WORLD_NAMES = { 1: 'Ilha Verde', 2: 'A Quinta', 3: 'Estrada do Leite' };
export const isUnlocked = (n) => n === 1 || (n === 2 && SAVE.world1.done);
// Próximo mundo a jogar: o primeiro desbloqueado ainda por acabar (ou o 1).
export const nextWorld = () => (!SAVE.world1.done ? 1 : !SAVE.world2.done ? 2 : 1);
