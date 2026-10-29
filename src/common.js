import { Sfx } from './sfx.js';
export const FONT = '"Arial Black", "Trebuchet MS", system-ui, sans-serif';
export const RED = 0xc4452d;
export const INK = 0x1c1410;

export function txt(scene, x, y, s, size = 24, opts = {}) {
  return scene.add.text(x, y, s, {
    fontFamily: FONT, fontSize: `${Math.round(size)}px`, color: '#ffffff', stroke: '#1C1410',
    strokeThickness: Math.max(2, Math.round(size / 6)), align: 'center', ...opts,
  }).setOrigin(0.5);
}

// Botão simples: retângulo arredondado + texto. Devolve um container.
export function button(scene, x, y, label, cb, { w = 240, h = 56, fill = RED, size = 22 } = {}) {
  const c = scene.add.container(x, y);
  const g = scene.add.graphics();
  const draw = (f) => { g.clear(); g.fillStyle(INK, 1); g.fillRoundedRect(-w / 2 + 3, -h / 2 + 5, w, h, 14); g.fillStyle(f, 1); g.fillRoundedRect(-w / 2, -h / 2, w, h, 14); g.lineStyle(3, INK, 1); g.strokeRoundedRect(-w / 2, -h / 2, w, h, 14); };
  draw(fill);
  const t = txt(scene, 0, 0, label, size);
  const hit = scene.add.rectangle(0, 0, w, h, 0xffffff, 0.001).setInteractive({ useHandCursor: true });
  c.add([g, t, hit]);
  hit.on('pointerdown', () => { Sfx.unlock(); c.setScale(0.95); });
  hit.on('pointerout', () => c.setScale(1));
  hit.on('pointerup', () => { c.setScale(1); Sfx.play('click'); cb(); });
  c.label = t;
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

// Fundo da Ilha Verde para ecrãs fixos.
export function pastureBackdrop(scene, w, h, groundY) {
  const g = scene.add.graphics();
  g.fillGradientStyle(0x5fb4ff, 0x5fb4ff, 0xcdeeff, 0xcdeeff, 1);
  g.fillRect(0, 0, w, groundY);
  g.fillStyle(0x2f8fd6); g.fillRect(0, groundY - 40, w, 40);
  g.fillStyle(0x7cc96a); g.fillEllipse(w * 0.2, groundY, w * 0.7, 120); g.fillEllipse(w * 0.8, groundY, w * 0.8, 150);
  g.fillStyle(0x4caf50); g.fillRect(0, groundY, w, h - groundY);
  g.fillStyle(0x6fd36f); g.fillRect(0, groundY, w, 6);
  g.fillStyle(0x8a5a33); g.fillRect(0, groundY + 40, w, h - groundY - 40);
  scene.add.image(w * 0.18, groundY * 0.22, 'nuvem').setAlpha(0.9);
  scene.add.image(w * 0.78, groundY * 0.12, 'nuvem').setScale(0.7);
  return g;
}

export function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
