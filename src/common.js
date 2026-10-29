import Phaser from 'phaser';
import { Sfx } from './sfx.js';
export const FONT = '"Luckiest Guy", "Arial Black", "Trebuchet MS", system-ui, sans-serif';
export const BODY_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
export const RED = 0xc4452d;
export const INK = 0x1c1410;
const SKIN = { [RED]: 'pill_red', 0x2d6cc4: 'pill_blue', 0x3a8f3e: 'pill_green', 0x1c1410: 'pill_purple', 0x777777: 'pill_grey', 0x8a3ff0: 'pill_purple', 0x18c7b0: 'pill_teal' };

export function txt(scene, x, y, s, size = 24, opts = {}) {
  return scene.add.text(x, y, s, {
    fontFamily: FONT, fontSize: `${Math.round(size)}px`, color: '#ffffff', stroke: '#1C1410',
    strokeThickness: Math.max(3, Math.round(size / 5)), align: 'center', ...opts,
  }).setOrigin(0.5);
}

// Botão "casino-pop": pele envernizada (nineslice a partir da arte) + texto Luckiest Guy. Devolve um container.
export function button(scene, x, y, label, cb, { w = 240, h = 56, fill = RED, size = 22, skin = null } = {}) {
  const c = scene.add.container(x, y);
  const key = skin || SKIN[fill] || 'pill_red';
  const s = (h * 1.18) / 120; // a pele tem sombra/rebordo: um pouco maior do que a área de toque
  const bg = scene.add.nineslice(0, 2 * s, key, null, Math.max(130, (w * 1.06) / s), 120, 62, 62, 0, 0).setScale(s);
  const t = txt(scene, 0, -2, label, size * 0.92);
  const hit = scene.add.rectangle(0, 0, w, h, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
  c.add([bg, t, hit]);
  hit.on('pointerdown', () => { Sfx.unlock(); c.setScale(0.94); });
  hit.on('pointerout', () => c.setScale(1));
  hit.on('pointerup', () => { c.setScale(1); Sfx.play('ui_click'); cb(); });
  c.label = t;
  c.hit = hit;
  c.setSkin = (k) => bg.setTexture(k);
  return c;
}

// Botão quadrado com ícone (menu, som). Devolve um container.
export function iconButton(scene, x, y, key, cb, size = 44) {
  const c = scene.add.container(x, y);
  const im = scene.add.image(0, 0, key).setDisplaySize(size, size);
  const hit = scene.add.rectangle(0, 0, size + 8, size + 8, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
  c.add([im, hit]);
  hit.on('pointerdown', () => { Sfx.unlock(); c.setScale(0.9); });
  hit.on('pointerout', () => c.setScale(1));
  hit.on('pointerup', () => { c.setScale(1); Sfx.play('ui_click'); cb(); });
  c.icon = im;
  c.hit = hit;
  return c;
}

// Reinicia a cena quando o ecrã muda de tamanho (títulos, intro, fim).
export function restartOnResize(scene, data) {
  let timer = null;
  const fn = () => { clearTimeout(timer); timer = setTimeout(() => scene.scene.isActive() && scene.scene.restart(data), 120); };
  scene.scale.on('resize', fn);
  scene.events.once('shutdown', () => { clearTimeout(timer); scene.scale.off('resize', fn); });
}

// Fundo em camadas para ecrãs fixos (título, intro do Mundo 2, fim): céu, longe, meio, perto + chão.
export function backdrop(scene, theme, w, h, groundY) {
  const k = Math.max(w / 1280, (groundY + 50) / 800);
  const out = [];
  for (const l of ['sky', 'far', 'mid', 'near']) {
    const key = `bg_${theme}_${l}`;
    if (l === 'sky') out.push(scene.add.image(w / 2, h / 2, key).setScale(Math.max(w / 1280, h / 800)));
    else out.push(scene.add.tileSprite(0, groundY + 50, w / k, scene.textures.get(key).getSourceImage().height, key).setOrigin(0, 1).setScale(k));
  }
  scene.add.tileSprite(0, groundY + 10, w, h - groundY, 'terra').setOrigin(0, 0).setTileScale(0.5);
  scene.add.tileSprite(0, groundY - 8, w, 26, 'relva').setOrigin(0, 0).setTileScale(0.5);
  return out;
}

// "Juice": texto que salta e sobe (+1, BOING!), e explosão de faíscas.
export function popText(scene, x, y, s, { size = 20, color = '#FFD43B', rise = 34, ms = 700, depth = 12 } = {}) {
  const t = txt(scene, x, y, s, size, { color }).setDepth(depth).setScale(0);
  scene.tweens.add({ targets: t, scale: { from: 0, to: 1 }, duration: 220, ease: 'Back.out' });
  scene.tweens.add({ targets: t, y: y - rise, alpha: 0, delay: ms * 0.45, duration: ms * 0.55, onComplete: () => t.destroy() });
  return t;
}
export function sparkles(scene, x, y, { n = 8, spread = 36, tint = 0xffffff, scale = 0.5, depth = 11, ms = 450 } = {}) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
    const d = spread * (0.6 + Math.random() * 0.6);
    const s = scene.add.image(x, y, 'faisca').setDepth(depth).setScale(scale).setBlendMode(Phaser.BlendModes.ADD).setTint(tint);
    scene.tweens.add({ targets: s, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, scale: 0.05, alpha: 0, angle: 90, duration: ms, ease: 'Cubic.out', onComplete: () => s.destroy() });
  }
}

export function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
