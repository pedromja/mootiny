import Phaser from 'phaser';
import { SAVE } from './save.js';
import { Sfx, PACK_LABEL } from './sfx.js';
import { txt, button, iconButton, FONT, BODY_FONT } from './common.js';
import { WORLD_NAMES } from './save.js';
const DOUBLE_TAP_MS = 450; // dois toques em ◀/▶ = arranque

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

    // zonas tácteis: véu muito leve + botões redondos da arte
    this.pads = this.add.graphics().setDepth(0);
    this.padImgs = { left: this.add.image(0, 0, 'touch_left'), right: this.add.image(0, 0, 'touch_right'), jump: this.add.image(0, 0, 'touch_jump'), dash: this.add.image(0, 0, 'touch_dash') };
    Object.values(this.padImgs).forEach((im) => im.setDepth(1));
    this.jumpLabel = txt(this, 0, 0, 'SALTAR', 15, { color: '#FFFFFF' }).setAlpha(0.6).setDepth(1);
    this.dashLabel = txt(this, 0, 0, 'ARRANQUE', 13, { color: '#FFD43B' }).setAlpha(0.6).setDepth(1);

    this.heartImgs = [0, 1, 2].map((i) => this.add.image(22 + i * 32, 26, 'coracao').setScale(0.7).setDepth(5));
    this.cloverIcon = this.add.sprite(22, 58, 'trevo', 0).setScale(0.62).setDepth(5);
    this.cloverText = this.add.text(40, 59, '0', { fontFamily: FONT, fontSize: '20px', color: '#fff', stroke: '#1C1410', strokeThickness: 5 }).setOrigin(0, 0.5).setDepth(5);
    this.timeText = this.add.text(0, 26, '', { fontFamily: FONT, fontSize: '17px', color: '#fff', stroke: '#1C1410', strokeThickness: 5 }).setOrigin(0.5).setDepth(5);
    const L = this.level.world;
    this.worldText = txt(this, 0, 22, `MUNDO ${L.id} · ${WORLD_NAMES[L.id].toUpperCase()}`, 18, { color: '#FFD43B' }).setDepth(5);
    this.soundBtn = iconButton(this, 0, 30, this.soundIcon(), () => {
      Sfx.cyclePack(); this.soundBtn.icon.setTexture(this.soundIcon()); this.toast(`Som: ${PACK_LABEL[SAVE.soundPack]}`, 1200);
    }, 46).setDepth(5);
    this.menuBtn = iconButton(this, 0, 30, 'btn_menu', () => this.level.scene.start('Title'), 46).setDepth(5);
    this.toastText = txt(this, 0, 0, '', 18, { backgroundColor: '#2A0F6BDD', padding: { x: 14, y: 9 }, strokeThickness: 4, wordWrap: { width: 340 } }).setDepth(20).setAlpha(0);
    this.bossBox = this.add.container(0, 0).setDepth(6).setVisible(false);
    this.bossTitle = txt(this, 0, 0, 'SUPER ORDENHADEIRA 3000', 15, { color: '#FFE0B2' });
    this.bossBar = this.add.graphics();
    this.bossBox.add([this.bossBar, this.bossTitle]);

    this.input.on('pointerdown', (p) => {
      if (!p.wasTouch || this.modalOpen || p.y < this.topH) return;
      const z = this.zoneAt(p.x);
      if (z === 'jump') this.touch.jumpQueued = true;
      if (z === 'dash') this.touch.dashQueued = true;
      // alternativa: dois toques rápidos em ◀ ou ▶ também dão arranque
      // tempo real (não o do frame): num telemóvel a 30 fps o tempo da cena "salta" e dois toques de ~250 ms falhavam a janela
      const now = performance.now();
      if ((z === 'left' || z === 'right') && SAVE.dash && this.lastTap.zone === z && now - this.lastTap.t < DOUBLE_TAP_MS) { this.touch.dashQueued = true; this.lastTap = { zone: null, t: 0 }; }
      else this.lastTap = { zone: z, t: now };
    });
    this.layout();
    this.onResize = () => this.layout();
    this.scale.on('resize', this.onResize);
    this.events.once('shutdown', () => this.scale.off('resize', this.onResize));
  }

  soundIcon() { return SAVE.soundPack === 'silencio' ? 'btn_som_off' : 'btn_som'; }

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
    this.soundBtn.setPosition(w - 82, 30);
    this.menuBtn.setPosition(w - 30, 30);
    this.worldText.setPosition(w / 2, 22).setVisible(w >= 560);
    this.timeText.setPosition(w / 2, w >= 560 ? 48 : 26);
    if (w < 560) this.timeText.setPosition(w - 150, 30);
    this.bossBox.setPosition(w / 2, w < 560 ? 92 : 70);
    this.drawBoss();
    this.toastText.setPosition(w / 2, Math.min(h * 0.24, 170)).setWordWrapWidth(Math.min(w - 40, 520));
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
      g.fillStyle(0x1c1410, 0.85).fillRoundedRect(x, 12, pw, 14, 6);
      if (i < hp) { g.fillStyle(0xe8302a).fillRoundedRect(x + 2, 14, pw - 4, 10, 5); g.fillStyle(0xffffff, 0.45).fillRoundedRect(x + 5, 15, pw - 10, 3, 2); }
      g.lineStyle(2, 0xffd43b).strokeRoundedRect(x, 12, pw, 14, 6);
    }
  }

  drawPads(l, r, j, d) {
    const { width: w, height: h } = this.scale;
    const g = this.pads;
    g.clear();
    const show = this.showTouch;
    Object.values(this.padImgs).forEach((im) => im.setVisible(show));
    this.jumpLabel.setVisible(show);
    this.dashLabel.setVisible(show && SAVE.dash);
    this.padImgs.dash.setVisible(show && SAVE.dash);
    if (!show) return;
    const top = this.topH;
    const z = this.zones();
    g.fillStyle(0xffffff, l ? 0.1 : 0.02); g.fillRect(0, top, z.l, h - top);
    g.fillStyle(0xffffff, r ? 0.1 : 0.02); g.fillRect(z.l, top, z.r - z.l, h - top);
    if (SAVE.dash) { g.fillStyle(0xffd43b, d ? 0.2 : 0.07); g.fillRect(z.r, top, z.d - z.r, h - top); }
    g.fillStyle(0xffffff, j ? 0.1 : 0.015); g.fillRect(z.d, top, w - z.d, h - top);
    g.lineStyle(1, 0xffffff, 0.1);
    for (const x of [z.l, z.r, z.d]) g.lineBetween(x, top + 20, x, h - 20);
    const size = Math.min(84, w * 0.17, h * 0.2);
    const cy = h - size * 0.5 - Math.min(40, h * 0.05);
    const place = (im, x, on) => im.setPosition(x, cy).setDisplaySize(on ? size * 1.08 : size, on ? size * 1.08 : size).setAlpha(on ? 0.95 : 0.6);
    place(this.padImgs.left, z.l / 2, l);
    place(this.padImgs.right, (z.l + z.r) / 2, r);
    const cj = (z.d + w) / 2;
    place(this.padImgs.jump, cj, j);
    this.jumpLabel.setPosition(cj, cy - size * 0.5 - 12).setAlpha(j ? 0.9 : 0.6);
    if (SAVE.dash) {
      const cd = (z.r + z.d) / 2;
      place(this.padImgs.dash, cd, d);
      this.padImgs.dash.setDisplaySize(Math.min(size, (z.d - z.r) * 0.9), Math.min(size, (z.d - z.r) * 0.9));
      this.dashLabel.setPosition(cd, cy - size * 0.5 - 12).setAlpha(d ? 0.9 : 0.6);
    }
  }

  update() {
    const L = this.level;
    if (!L || !L.player) return;
    this.heartImgs.forEach((im, i) => im.setTexture(i < L.hearts ? 'coracao' : 'coracao_vazio'));
    this.cloverText.setText(`× ${L.clovers}/${L.totalClovers}`);
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

  // o trevo do HUD dá um pulo quando apanhas um
  bumpClover() {
    // uma volta só e pára de frente (assim o ícone nunca fica "de lado")
    this.cloverIcon.play({ key: 'trevo_spin', repeat: 0 }, true);
    this.cloverIcon.once('animationcomplete', () => this.cloverIcon.setFrame(0));
    this.tweens.add({ targets: [this.cloverIcon, this.cloverText], scale: '*=1.25', duration: 90, yoyo: true, onComplete: () => { this.cloverIcon.setScale(0.62); this.cloverText.setScale(1); } });
  }

  // chama a atenção para o botão ▶▶ (quando a Mimosa está encostada aos fardos)
  flashDash() {
    if (!SAVE.dash || !this.showTouch) return;
    const im = this.padImgs.dash;
    this.tweens.killTweensOf(im);
    const s0 = im.scaleX;
    this.tweens.add({ targets: im, scaleX: s0 * 1.35, scaleY: s0 * 1.35, alpha: 1, duration: 220, yoyo: true, repeat: 4, onComplete: () => this.drawPads(false, false, false, false) });
  }

  toast(msg, ms = 2600) {
    if (!this.toastText) return;
    this.tweens.killTweensOf(this.toastText);
    this.toastText.setText(msg).setAlpha(1).setScale(0.8);
    this.tweens.add({ targets: this.toastText, scale: 1, duration: 180, ease: 'Back.out' });
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
    const dim = this.add.rectangle(w / 2, h / 2, w, h, 0x0a0628, 0.6).setInteractive();
    const pw = Math.min(w - 32, 460), ph = 270;
    const panel = this.add.graphics();
    panel.fillStyle(0xffd43b).fillRoundedRect(w / 2 - pw / 2 - 6, h / 2 - ph / 2 - 6, pw + 12, ph + 12, 22).lineStyle(4, 0x1c1410).strokeRoundedRect(w / 2 - pw / 2 - 6, h / 2 - ph / 2 - 6, pw + 12, ph + 12, 22);
    panel.fillGradientStyle(0xa86af5, 0xa86af5, 0x4a1a9e, 0x4a1a9e, 1).fillRoundedRect(w / 2 - pw / 2, h / 2 - ph / 2, pw, ph, 18);
    const t = txt(this, w / 2, h / 2 - ph / 2 + 34, m.title, 26, { color: '#FFD43B' });
    const b = this.add.text(w / 2, h / 2 - 34, m.body, { fontFamily: BODY_FONT, fontSize: '17px', color: '#FFFFFF', align: 'center', fontStyle: 'bold', wordWrap: { width: pw - 32 } }).setOrigin(0.5);
    const close = (fn) => () => { this.modalBox.destroy(); this.modalBox = null; this.modalOpen = false; fn(); };
    const bw = Math.min(200, (pw - 48) / 2);
    this.modalBtns = {
      yes: button(this, w / 2 - bw / 2 - 8, h / 2 + ph / 2 - 50, m.yesLabel, close(m.onYes), { w: bw, h: 52, size: 15, fill: 0x3a8f3e }),
      no: button(this, w / 2 + bw / 2 + 8, h / 2 + ph / 2 - 50, m.noLabel, close(m.onNo), { w: bw, h: 52, size: 15, fill: 0xc4452d }),
    };
    c.add([dim, panel, t, b, this.modalBtns.yes, this.modalBtns.no]);
    c.setScale(0.9).setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 150 });
    c.setScale(1);
  }
}
