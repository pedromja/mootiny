// Lista de recursos (arte 2x → setScale(0.5); fundos webp; áudio .ogg/.mp3).
import { SFX_KEYS } from './sfx.js';
import LAYERS from './intro-layers.json';

const SHEETS = {
  mimosa: [96, 128], mana: [96, 128], mana2: [96, 128], mana3: [96, 128], mana4: [96, 128],
  can: [72, 88], agricultor: [96, 128], trator: [384, 256], ordenhadeira: [320, 210], trevo: [48, 52], cerca: [64, 96], bandeira: [80, 140],
};
const IMAGES = ['trator_sticker', 'relva', 'terra', 'plataforma', 'feno', 'coracao', 'coracao_vazio', 'faisca', 'btn_jogar', 'btn_jogar_down', 'btn_menu', 'btn_som', 'btn_som_off', 'btn_pausa',
  'touch_left', 'touch_right', 'touch_jump', 'touch_dash', 'logo', 'cardo', 'poder', 'cogumelo', 'ferradura', 'jaula', 'portao', 'cercado', 'gota', 'placa',
  'pill_red', 'pill_blue', 'pill_purple', 'pill_teal', 'pill_green', 'pill_grey'];

export function preloadGame(scene) {
  const L = scene.load;
  L.setPath(`${import.meta.env.BASE_URL}assets/`);
  for (const [k, [fw, fh]] of Object.entries(SHEETS)) L.spritesheet(k, `art/${k}.png`, { frameWidth: fw, frameHeight: fh });
  for (const k of IMAGES) L.image(k, `art/${k}.png`);
  for (const w of ['ilha', 'quinta']) for (const l of ['sky', 'far', 'mid', 'near']) L.image(`bg_${w}_${l}`, `art/bg_${w}_${l}.webp`);
  for (const p of ['classico', 'mootiny']) for (const k of SFX_KEYS) L.audio(`${p}_${k}`, [`audio/${p}/${k}.ogg`, `audio/${p}/${k}.mp3`]);
  L.audio('music_theme', ['audio/music/mootiny-theme.ogg', 'audio/music/mootiny-theme.mp3']);
  L.audio('music_boss', ['audio/music/mootiny-boss.ogg', 'audio/music/mootiny-boss.mp3']);
  L.setPath('');
}

export const INTRO = LAYERS;
export function preloadIntro(scene) {
  const L = scene.load;
  L.setPath(`${import.meta.env.BASE_URL}assets/intro/`);
  for (const p of LAYERS) for (const l of p.layers) if (!scene.textures.exists(l.key)) L.image(l.key, l.file);
  L.setPath('');
}

export function makeAnims(scene) {
  const A = scene.anims;
  const n = (key, cfg) => A.generateFrameNumbers(key, cfg);
  if (A.exists('idle')) return;
  A.create({ key: 'idle', frames: n('mimosa', { frames: [0, 1] }), frameRate: 2.5, repeat: -1 });
  A.create({ key: 'walk', frames: n('mimosa', { start: 2, end: 5 }), frameRate: 12, repeat: -1 });
  A.create({ key: 'can_walk', frames: n('can', { frames: [0, 1] }), frameRate: 6, repeat: -1 });
  A.create({ key: 'farmer_walk', frames: n('agricultor', { frames: [0, 1] }), frameRate: 6, repeat: -1 });
  A.create({ key: 'trator_drive', frames: n('trator', { start: 0, end: 2 }), frameRate: 10, repeat: -1 });
  A.create({ key: 'trevo_spin', frames: n('trevo', { start: 0, end: 5 }), frameRate: 10, repeat: -1 });
}
