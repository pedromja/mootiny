import Phaser from 'phaser';
import { SAVE } from './save.js';
import { Sfx, PACK_LABEL } from './sfx.js';
import { txt, button, FONT } from './common.js';

// HUD + comandos tácteis em marca de água (ecrã inteiro) + avisos + janela modal + barra do chefe.
export class HudScene extends Phaser.Scene {
  constructor() { super('Hud'); }

  create() {
    this.level = this.scene.get('Level');
    this.touch = { left: false, right: false, jumpHeld: false, jumpQueued: false, dash: false, dashQueued: false };
    this.showTouch = this.sys.game.device.input.touch;
    this.modalOpen = false;
    this.modalBox = null;
    this.topH = 64;
    // ponteiros extra só uma vez por jogo (antes somava 3 a cada nível)
    if (!this.game.registry.get('extraPointers')) { this.input.addPointer(3); this.game.registry.set('extraPointers', true); }
    this.lastTap = { zone: null, t: 0 };

    this.pads = this.add.graphics().setDepth(0);
    this.padIcons = this.add.graphics().setDepth(1);
    this.jumpLabel = txt(this, 0, 0, 'SALTAR', 18, { color: '#FFFFFF', strokeThickness: 0 }).setAlpha(0.35).setDepth(1);
    this.dashLabel = txt(this, 0, 0, 'ARRANQUE', 13, { color: '#FFFFFF', strokeThickness: 0 }).setAlpha(0.35).setDepth(1);

    this.heartImgs = [0, 1, 2].map((i) => this.add.image(22 + i * 28, 26, 'coracao').setDepth(5));
    this.cloverIcon = this.add.image(22, 56, 'trevo').setScale(0.9).setDepth(5);
    this.cloverText = this.add.text(38, 56, '0', { fontFamily: FONT, fontSize: '18px', color: '#fff', stroke: '#1C1410', strokeThickness: 4 }).setOrigin(0, 0.5).setDepth(5);
    this.timeText = this.add.text(0, 26, '', { fontFamily: FONT, fontSize: '16px', color: '#fff', stroke: '#1C1410', strokeThickness: 4 }).setOrigin(0.5).setDepth(5);
    this.soundBtn = button(this, 0, 28, this.soundLabel(), () => { Sfx.cyclePack(); this.soundBtn.label.setText(this.soundLabel()); }, { w: 128, h: 38, size: 14, fill: 0x2d6cc4 }).setDepth(5);
    this.menuBtn = button(this, 0, 28, 'Menu', () => this.level.scene.start('Title'), { w: 72, h: 38, size: 14, fill: 0x1c1410 }).setDepth(5);
    this.toastText = txt(this, 0, 0, '', 18, { backgroundColor: '#1C1410CC', padding: { x: 12, y: 8 }, strokeThickness: 0, wordWrap: { width: 340 } }).setDepth(20).setAlpha(0);
    this.bossBox = this.add.container(0, 0).setDepth(6).setVisible(false);
    this.bossTitle = txt(this, 0, 0, 'SUPER ORDENHADEIRA 3000', 14, { color: '#FFE0B2' });
    this.bossBar = this.add.graphics();
    this.bossBox.add([this.bossBar, this.bossTitle]);

    this.input.on('pointerdown', (p) => {
      if (!p.wasTouch || this.modalOpen || p.y < this.topH) return;
      const z = this.zoneAt(p.x);
      if (z === 'jump') this.touch.jumpQueued = true;
      if (z === 'dash') this.touch.dashQueued = true;
      // alternativa: dois toques rápidos em ◀ ou ▶ também dão arranque
      if ((z === 'left' || z === 'right') && SAVE.dash && this.lastTap.zone === z && this.time.now - this.lastTap.t < 300) this.touch.dashQueued = true;
      this.lastTap = { zone: z, t: this.time.now };
    });
    this.layout();
    this.onResize = () => this.layout();
    this.scale.on('resize', this.onResize);
    this.events.once('shutdown', () => this.scale.off('resize', this.onResize));
  }

  soundLabel() { return `♪ ${PACK_LABEL[SAVE.soundPack]}`; }

  // ¼ esquerda, ¼ direita, resto saltar; com arranque: faixa do meio-direita é o arranque.
  zones() {
    const w = this.scale.width;
    return SAVE.dash ? { l: w * 0.25, r: w * 0.5, d: w * 0.68 } : { l: w * 0.25, r: w * 0.5, d: w * 0.5 };
  }

  zoneAt(x) {
    const z = this.zones();
    return x < z.l ? 'left' : x < z.r ? 'right' : x < z.d ? 'dash' : 'jump';
  }

  layout() {
    const { width: w, height: h } = this.scale;
    this.soundBtn.setPosition(w - 70, 28);
    this.menuBtn.setPosition(w - 70 - 64 - 46, 28);
    this.timeText.setPosition(w / 2, 26);
    if (w < 480) this.timeText.setPosition(150, 56);
    this.bossBox.setPosition(w / 2, w < 480 ? 96 : 60);
    this.drawBoss();
    this.toastText.setPosition(w / 2, Math.min(h * 0.22, 160)).setWordWrapWidth(Math.min(w - 40, 520));
    this.drawPads(false, false, false, false);
    if (this.modalBox) this.buildModal();
  }

  setBoss(hp, max, done = false) {
    this.boss = { hp, max };
    this.bossBox.setVisible(!done);
    this.drawBoss();
  }

  drawBoss() {
    if (!this.boss) return;
    const g = this.bossBar; g.clear();
    const { hp, max } = this.boss;
    const pw = 46;
    for (let i = 0; i < max; i++) {
      const x = -((max * (pw + 6)) / 2) + i * (pw + 6);
      g.fillStyle(0x1c1410, 0.8).fillRoundedRect(x, 12, pw, 12, 4);
      if (i < hp) g.fillStyle(0xe8302a).fillRoundedRect(x + 2, 14, pw - 4, 8, 3);
    }
  }

  drawPads(l, r, j, d) {
    const { width: w, height: h } = this.scale;
    const g = this.pads; const ic = this.padIcons;
    g.clear(); ic.clear();
    this.jumpLabel.setVisible(this.showTouch);
    this.dashLabel.setVisible(this.showTouch && SAVE.dash);
    if (!this.showTouch) return;
    const top = this.topH;
    const z = this.zones();
    g.fillStyle(0xffffff, l ? 0.12 : 0.03); g.fillRect(0, top, z.l, h - top);
    g.fillStyle(0xffffff, r ? 0.12 : 0.03); g.fillRect(z.l, top, z.r - z.l, h - top);
    if (SAVE.dash) { g.fillStyle(0xffd27a, d ? 0.22 : 0.08); g.fillRect(z.r, top, z.d - z.r, h - top); }
    g.fillStyle(0xffffff, j ? 0.12 : 0.02); g.fillRect(z.d, top, w - z.d, h - top);
    g.lineStyle(1, 0xffffff, 0.12);
    for (const x of [z.l, z.r, z.d]) g.lineBetween(x, top + 20, x, h - 20);
    const cy = h - Math.min(110, h * 0.14);
    const s = Math.min(34, w * 0.07);
    const cl = z.l / 2, cr = (z.l + z.r) / 2, cj = (z.d + w) / 2;
    ic.fillStyle(0xffffff, l ? 0.6 : 0.3); ic.fillTriangle(cl + s * 0.6, cy - s, cl + s * 0.6, cy + s, cl - s * 0.8, cy);
    ic.fillStyle(0xffffff, r ? 0.6 : 0.3); ic.fillTriangle(cr - s * 0.6, cy - s, cr - s * 0.6, cy + s, cr + s * 0.8, cy);
    ic.fillStyle(0xffffff, j ? 0.6 : 0.3); ic.fillTriangle(cj - s, cy + s * 0.3, cj + s, cy + s * 0.3, cj, cy - s * 1.1);
    this.jumpLabel.setPosition(cj, cy + s * 0.3 + 20).setAlpha(j ? 0.7 : 0.35);
    if (SAVE.dash) {
      const cd = (z.r + z.d) / 2, ss = s * 0.6;
      ic.fillStyle(0xffd27a, d ? 0.7 : 0.35);
      ic.fillTriangle(cd - ss * 1.2, cy - ss, cd - ss * 1.2, cy + ss, cd, cy);
      ic.fillTriangle(cd - ss * 0.1, cy - ss, cd - ss * 0.1, cy + ss, cd + ss * 1.1, cy);
      this.dashLabel.setPosition(cd, cy + s * 0.3 + 20).setAlpha(d ? 0.7 : 0.35);
    }
  }

  update() {
    const L = this.level;
    if (!L || !L.player) return;
    this.heartImgs.forEach((im, i) => im.setTexture(i < L.hearts ? 'coracao' : 'coracao_vazio'));
    this.cloverText.setText(`${L.clovers}/${L.totalClovers}`);
    const s = Math.floor(L.elapsed / 1000);
    this.timeText.setText(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);

    let left = false, right = false, jump = false, dash = false;
    if (!this.modalOpen) {
      for (const p of this.input.manager.pointers) {
        if (!p.isDown || !p.wasTouch || p.y < this.topH) continue;
        const z = this.zoneAt(p.x);
        if (z === 'left') left = true; else if (z === 'right') right = true; else if (z === 'dash') dash = true; else jump = true;
      }
    }
    const t = this.touch;
    if (left !== t.left || right !== t.right || jump !== t.jumpHeld || dash !== t.dash) this.drawPads(left, right, jump, dash);
    t.left = left; t.right = right; t.jumpHeld = jump; t.dash = dash;
  }

  toast(msg, ms = 2600) {
    if (!this.toastText) return;
    this.tweens.killTweensOf(this.toastText);
    this.toastText.setText(msg).setAlpha(1);
    this.tweens.add({ targets: this.toastText, alpha: 0, delay: ms, duration: 400 });
  }

  modal(title, body, yesLabel, onYes, noLabel, onNo) {
    this.modalSpec = { title, body, yesLabel, onYes, noLabel, onNo };
    this.modalOpen = true;
    this.touch.jumpQueued = false;
    this.touch.dashQueued = false;
    this.buildModal();
  }

  buildModal() {
    if (this.modalBox) this.modalBox.destroy();
    const { width: w, height: h } = this.scale;
    const m = this.modalSpec;
    const c = this.modalBox = this.add.container(0, 0).setDepth(50);
    const dim = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.55).setInteractive();
    const pw = Math.min(w - 32, 460), ph = 270;
    const panel = this.add.graphics();
    panel.fillStyle(0xfff8ec).fillRoundedRect(w / 2 - pw / 2, h / 2 - ph / 2, pw, ph, 18).lineStyle(4, 0xc4452d).strokeRoundedRect(w / 2 - pw / 2, h / 2 - ph / 2, pw, ph, 18);
    const t = txt(this, w / 2, h / 2 - ph / 2 + 34, m.title, 24, { stroke: '#C4452D', strokeThickness: 6 });
    const b = this.add.text(w / 2, h / 2 - 34, m.body, { fontFamily: 'system-ui, sans-serif', fontSize: '17px', color: '#1C1410', align: 'center', wordWrap: { width: pw - 32 } }).setOrigin(0.5);
    const close = (fn) => () => { this.modalBox.destroy(); this.modalBox = null; this.modalOpen = false; fn(); };
    const bw = Math.min(200, (pw - 48) / 2);
    const yes = button(this, w / 2 - bw / 2 - 8, h / 2 + ph / 2 - 50, m.yesLabel, close(m.onYes), { w: bw, h: 52, size: 15, fill: 0x3a8f3e });
    const no = button(this, w / 2 + bw / 2 + 8, h / 2 + ph / 2 - 50, m.noLabel, close(m.onNo), { w: bw, h: 52, size: 15, fill: 0xc4452d });
    c.add([dim, panel, t, b, yes, no]);
  }
}
