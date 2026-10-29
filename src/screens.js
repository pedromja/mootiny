import Phaser from 'phaser';
import { makeTextures } from './textures.js';
import { SAVE, persist, WORLD_NAMES, isUnlocked, nextWorld } from './save.js';
import { Sfx, PACK_LABEL } from './sfx.js';
import { txt, button, restartOnResize, pastureBackdrop, fmtTime } from './common.js';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() {
    makeTextures(this);
    this.anims.create({ key: 'walk', frames: [{ key: 'mimosa_walk1' }, { key: 'mimosa_idle' }, { key: 'mimosa_walk2' }, { key: 'mimosa_idle' }], frameRate: 12, repeat: -1 });
    this.anims.create({ key: 'farmer_walk', frames: [{ key: 'agricultor1' }, { key: 'agricultor2' }], frameRate: 6, repeat: -1 });
    this.anims.create({ key: 'can_walk', frames: [{ key: 'can1' }, { key: 'can2' }], frameRate: 6, repeat: -1 });
    this.scene.start('Title');
  }
}

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    const { width: w, height: h } = this.scale;
    const groundY = Math.round(h * 0.8);
    pastureBackdrop(this, w, h, groundY);
    const u = Math.min(w / 390, h / 700);

    const logo = txt(this, w / 2, h * 0.11, 'MOOTINY', Math.min(84, 62 * u), { color: '#FFFFFF', stroke: '#C4452D', strokeThickness: Math.round(13 * u) });
    this.tweens.add({ targets: logo, angle: { from: -2, to: 2 }, yoyo: true, repeat: -1, duration: 1400, ease: 'Sine.inOut' });
    txt(this, w / 2, h * 0.11 + 50 * u, 'A revolta das vacas', 21 * u, { color: '#FFF3A0' });

    const mim = this.add.image(w * 0.5, groundY + 4, 'mimosa_idle').setOrigin(0.5, 1).setScale((h * 0.14) / 64);
    this.tweens.add({ targets: mim, y: groundY - 10 * u, yoyo: true, repeat: -1, duration: 600, ease: 'Sine.inOut' });
    this.add.image(w * 0.5 + 56 * u * (h / 700), groundY + 2, 'cogumelo').setOrigin(0.5, 1).setScale(1.4 * u);

    const go = (world) => this.scene.start('Intro', { world });
    const by = h * 0.29;
    const bw = Math.min(320, w * 0.8);
    const half = (bw - 10) / 2;
    const nw = nextWorld();
    const allDone = SAVE.world1.done && SAVE.world2.done;
    const playLabel = allDone ? '▶  Jogar' : `▶  Jogar · Mundo ${nw}`;
    button(this, w / 2, by, playLabel, () => go(nw), { w: bw, h: 58, size: 22 });

    // seleção de mundos
    txt(this, w / 2, by + 50, 'Mundos', 15, { color: '#FFF3A0' });
    const w1 = SAVE.world1, w2 = SAVE.world2;
    button(this, w / 2 - half / 2 - 5, by + 88, `1 · ${WORLD_NAMES[1]}${w1.done ? ' ✓' : ''}`, () => go(1), { w: half, h: 46, size: 14, fill: 0x3a8f3e });
    const unlocked2 = isUnlocked(2);
    const b2 = button(this, w / 2 + half / 2 + 5, by + 88, unlocked2 ? `2 · ${WORLD_NAMES[2]}${w2.done ? ' ✓' : ''}` : '2 · bloqueado', () => {
      if (unlocked2) go(2); else this.flash('Acaba a Ilha Verde para abrir A Quinta.');
    }, { w: half, h: 46, size: 14, fill: unlocked2 ? 0x3a8f3e : 0x777777 });
    b2.name = 'world2';
    const stat = (ws) => (ws.done ? `trevos ${ws.bestClovers} · ${fmtTime(ws.bestTime)}` : '—');
    txt(this, w / 2 - half / 2 - 5, by + 124, stat(w1), 11, { color: '#FFFFFF' });
    txt(this, w / 2 + half / 2 + 5, by + 124, unlocked2 ? stat(w2) : 'acaba o Mundo 1', 11, { color: '#FFFFFF' });

    const snd = button(this, w / 2 - half / 2 - 5, by + 166, `Som: ${PACK_LABEL[SAVE.soundPack]}`, () => {
      Sfx.cyclePack(); snd.label.setText(`Som: ${PACK_LABEL[SAVE.soundPack]}`);
    }, { w: half, h: 44, size: 14, fill: 0x2d6cc4 });
    const easy = button(this, w / 2 + half / 2 + 5, by + 166, `Modo fácil: ${SAVE.easy ? 'sim' : 'não'}`, () => {
      SAVE.easy = !SAVE.easy; persist(); easy.label.setText(`Modo fácil: ${SAVE.easy ? 'sim' : 'não'}`);
    }, { w: half, h: 44, size: 14, fill: 0x2d6cc4 });

    const powers = [SAVE.doubleJump && 'duplo salto', SAVE.dash && 'arranque'].filter(Boolean);
    txt(this, w / 2, groundY + (h - groundY) * 0.3, powers.length ? `Poderes: ${powers.join(' · ')}` : 'Mundos 3 a 5: em breve', Math.min(16, 14 * u));
    if (powers.length) txt(this, w / 2, groundY + (h - groundY) * 0.3 + 22 * u, 'Mundos 3 a 5: em breve', Math.min(14, 12 * u), { color: '#FFE0B2' });
    const priv = txt(this, w / 2, h - 16 * u, 'Política de privacidade', Math.min(15, 13 * u), { color: '#FFE0B2' }).setInteractive({ useHandCursor: true });
    priv.on('pointerup', () => { window.location.href = `${import.meta.env.BASE_URL}privacidade/`; });
    this.msg = txt(this, w / 2, by + 210, '', 14, { color: '#FFF3A0' });

    this.input.keyboard.once('keydown-ENTER', () => go(nw));
    this.input.keyboard.once('keydown-SPACE', () => go(nw));
    restartOnResize(this);
  }
  flash(m) {
    this.msg.setText(m).setAlpha(1);
    this.tweens.killTweensOf(this.msg);
    this.tweens.add({ targets: this.msg, alpha: 0, delay: 1800, duration: 400 });
  }
}

const STORY = {
  1: [
    ['As vacas da Ilha Verde pastavam. Só isso.', 0],
    ['Depois da trovoada, nasceram cogumelos da consciência…', 0],
    ['…Espera. Eu estou a PENSAR?', 1],
    ['As minhas manas não são máquinas de leite!', 1],
    ['A Mana Estrela está presa no cercado. Vou buscá-la!', 1],
  ],
  2: [
    ['A Quinta. Tratores, cercas elétricas e agricultores rabugentos.', 0],
    ['As manas estão fechadas no estábulo, presas à Super Ordenhadeira 3000.', 0],
    ['Ordenha automática? Nem pensar. Vou abrir aquilo tudo!', 1],
    ['Dizem que há uma ferradura-turbo algures na quinta…', 2],
    ['Então vamos a correr. Mana Estrela, fica de vigia!', 1],
  ],
};

export class IntroScene extends Phaser.Scene {
  constructor() { super('Intro'); }
  create(data) {
    this.world = (data && data.world) || 1;
    const { width: w, height: h } = this.scale;
    const groundY = Math.round(h * 0.72);
    pastureBackdrop(this, w, h, groundY);
    const s = Math.max(2, Math.min(w, h) / 230);
    this.lines = STORY[this.world];
    const boxW = Math.min(w - 32, 640);
    this.box = this.add.graphics();
    this.box.fillStyle(0xffffff, 0.95).fillRoundedRect(w / 2 - boxW / 2, 74, boxW, 96, 16).lineStyle(3, 0x1c1410).strokeRoundedRect(w / 2 - boxW / 2, 74, boxW, 96, 16);
    this.who = txt(this, w / 2 - boxW / 2 + 16, 78, '', 16, { color: '#C4452D', stroke: '#fff', strokeThickness: 0 }).setOrigin(0, 0);
    this.say = this.add.text(w / 2, 130, '', { fontFamily: 'system-ui, sans-serif', fontSize: `${Math.min(20, w / 22)}px`, color: '#1C1410', align: 'center', wordWrap: { width: boxW - 28 }, fontStyle: 'bold' }).setOrigin(0.5);
    this.idx = -1;
    this.done = false;
    button(this, w - 80, 36, 'Saltar ▸', () => this.finish(), { w: 130, h: 42, size: 16, fill: 0x1c1410 });
    txt(this, 20, 36, `Mundo ${this.world} · ${WORLD_NAMES[this.world]}`, 15, { color: '#FFF3A0' }).setOrigin(0, 0.5);

    if (this.world === 1) this.introIsland(w, h, groundY, s); else this.introFarm(w, h, groundY, s);

    this.input.on('pointerup', () => this.next()); // qualquer toque avança (também na caixa de texto)
    this.input.keyboard.on('keydown-SPACE', () => this.next());
    this.input.keyboard.on('keydown-ENTER', () => this.next());
    this.input.keyboard.on('keydown-ESC', () => this.finish());
  }

  introIsland(w, h, groundY, s) {
    this.ready = false;
    const mush = this.add.image(w * 0.64, groundY + 2, 'cogumelo').setOrigin(0.5, 1).setScale(s * 0.8);
    const mim = this.add.image(w * 0.12, groundY + 4, 'mimosa_sleepy').setOrigin(0.5, 1).setScale(s);
    this.next();
    this.time.delayedCall(1400, () => this.next());
    this.tweens.add({ targets: mim, x: w * 0.64 - 34 * s, duration: 1800, delay: 500, ease: 'Sine.inOut' });
    this.tweens.add({ targets: mim, y: groundY - 6, yoyo: true, repeat: 5, duration: 160, delay: 500 });
    this.time.delayedCall(2500, () => this.tweens.add({ targets: mim, angle: 18, duration: 250, yoyo: true, hold: 300 }));
    this.time.delayedCall(2800, () => {
      this.tweens.add({ targets: mush, scale: 0, duration: 200 });
      Sfx.play('plop');
      this.cameras.main.flash(250, 255, 255, 255);
      this.cameras.main.shake(250, 0.01);
      const plop = txt(this, w * 0.55, groundY - 64 * s - 30, 'PLOP!', Math.min(72, w / 6), { color: '#FFF3A0', stroke: '#8E44AD', strokeThickness: 10 }).setScale(0.2);
      this.tweens.add({ targets: plop, scale: 1, duration: 300, ease: 'Back.out' });
      this.tweens.add({ targets: plop, alpha: 0, y: plop.y - 40, delay: 1200, duration: 500 });
    });
    this.time.delayedCall(3400, () => {
      mim.setTexture('mimosa_idle');
      const bang = txt(this, mim.x + 20 * s, groundY - 70 * s, '!', 48, { color: '#C4452D' });
      this.tweens.add({ targets: bang, y: bang.y - 20, alpha: 0, delay: 700, duration: 400 });
      this.tweens.add({ targets: mim, y: groundY - 30, yoyo: true, duration: 180 });
      Sfx.play('moo');
      this.ready = true;
      this.next();
    });
  }

  introFarm(w, h, groundY, s) {
    this.ready = true;
    // estábulo com as manas lá dentro
    const g = this.add.graphics();
    const bw = Math.min(260, w * 0.5), bh = bw * 0.62, bx = w * 0.7 - bw / 2;
    g.fillStyle(0xb8322a); g.fillRect(bx, groundY - bh, bw, bh);
    g.fillTriangle(bx - 14, groundY - bh, bx + bw + 14, groundY - bh, bx + bw / 2, groundY - bh - bw * 0.36);
    g.fillStyle(0xffffff); g.fillRect(bx + bw / 2 - bw * 0.2, groundY - bh * 0.7, bw * 0.4, bh * 0.7);
    g.fillStyle(0x4a1a14); g.fillRect(bx + bw / 2 - bw * 0.17, groundY - bh * 0.66, bw * 0.34, bh * 0.66);
    g.lineStyle(3, 0x1c1410); g.strokeRect(bx, groundY - bh, bw, bh);
    const eyes = this.add.graphics();
    eyes.fillStyle(0xfff3a0);
    [[-0.1, 0.45], [0.06, 0.38], [0.12, 0.52]].forEach(([dx, dy]) => { eyes.fillCircle(bx + bw / 2 + dx * bw - 4, groundY - bh * dy, 3); eyes.fillCircle(bx + bw / 2 + dx * bw + 4, groundY - bh * dy, 3); });
    this.tweens.add({ targets: eyes, alpha: 0.2, yoyo: true, repeat: -1, duration: 700 });
    txt(this, bx + bw / 2, groundY - bh - bw * 0.36 - 18, 'LEITARIA AUTOMÁTICA', 13, { color: '#FFE0B2' });
    const help = txt(this, bx + bw / 2, groundY - bh * 0.45 - 30, 'Muuu… socorro…', 14, { color: '#FFFFFF' });
    this.tweens.add({ targets: help, alpha: 0.3, yoyo: true, repeat: -1, duration: 900 });
    const mim = this.add.image(w * 0.18, groundY + 4, 'mimosa_idle').setOrigin(0.5, 1).setScale(s);
    this.tweens.add({ targets: mim, y: groundY - 8, yoyo: true, repeat: -1, duration: 400 });
    const tr = this.add.image(-120, groundY - 20, 'trator').setScale(Math.min(1.4, s * 0.6)).setFlipX(true);
    this.tweens.add({ targets: tr, x: w + 140, duration: 5200, repeat: -1, delay: 600 });
    this.next();
  }

  next() {
    if (this.world === 1 && this.idx >= 1 && !this.ready) return; // espera pelo PLOP
    this.idx++;
    if (this.idx >= this.lines.length) return this.finish();
    const [line, who] = this.lines[this.idx];
    this.who.setText(who === 1 ? 'Mimosa' : who === 2 ? 'Mana Estrela' : 'Narrador');
    this.say.setText(line);
    if (this.idx === this.lines.length - 1) this.say.setText(line + '\n(toca para começar)');
  }
  finish() {
    if (this.done) return;
    this.done = true;
    this.cameras.main.fadeOut(300, 28, 20, 16);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Level', { world: this.world }));
  }
}

export class CompleteScene extends Phaser.Scene {
  constructor() { super('Complete'); }
  create(data) {
    const { width: w, height: h } = this.scale;
    const groundY = Math.round(h * 0.8);
    pastureBackdrop(this, w, h, groundY);
    const u = Math.min(w / 390, h / 700);
    const { world = 1, clovers = 0, total = 0, time = 0, record = false } = data || {};
    txt(this, w / 2, h * 0.1, 'Nível concluído!', Math.min(52, 40 * u), { stroke: '#C4452D', strokeThickness: 10 });
    txt(this, w / 2, h * 0.1 + 48 * u, world === 1 ? 'A Mana Estrela está livre!' : 'A Ordenhadeira foi à vida! Manas livres!', Math.min(22, 19 * u), { color: '#FFF3A0' });

    const panelW = Math.min(360, w * 0.86);
    const g = this.add.graphics();
    g.fillStyle(0x1c1410, 0.75).fillRoundedRect(w / 2 - panelW / 2, h * 0.24, panelW, 140, 16);
    this.add.image(w / 2 - panelW / 2 + 40, h * 0.24 + 36, 'trevo').setScale(1.4);
    txt(this, w / 2 + 10, h * 0.24 + 36, `Trevos: ${clovers} / ${total}`, 22);
    txt(this, w / 2, h * 0.24 + 76, `Tempo: ${fmtTime(time)}${record ? '  · recorde!' : ''}`, 20, { color: record ? '#FFF3A0' : '#FFFFFF' });
    txt(this, w / 2, h * 0.24 + 112, world === 1 ? 'Duplo salto: guardado ✓' : 'Arranque: guardado ✓', 16, { color: '#A8F0A0' });

    const s = (h * 0.13) / 64;
    const herd = world === 1 ? ['mimosa_jump', 'mana_happy'] : ['mimosa_jump', 'mana_happy', 'mana2_happy', 'mana3_happy', 'mana4_happy'];
    const step = Math.min(44 * s, (w - 60) / herd.length);
    herd.forEach((key, i) => {
      const x = w / 2 + (i - (herd.length - 1) / 2) * step;
      const c = this.add.image(x, groundY + 4, key).setOrigin(0.5, 1).setScale(s).setFlipX(i > 0);
      this.tweens.add({ targets: c, y: groundY - 30, yoyo: true, repeat: -1, duration: 380, delay: i * 120, ease: 'Sine.out' });
    });

    const bw = Math.min(280, w * 0.74);
    const y0 = h * 0.24 + 190;
    if (world === 1) {
      button(this, w / 2, y0, '▶  Próximo: A Quinta', () => this.scene.start('Intro', { world: 2 }), { w: bw, h: 54, size: 20 }).name = 'next';
      button(this, w / 2, y0 + 62, '↻  Jogar outra vez', () => this.scene.start('Level', { world }), { w: bw, h: 46, size: 17, fill: 0x3a8f3e });
      button(this, w / 2, y0 + 116, 'Menu', () => this.scene.start('Title'), { w: bw, h: 44, size: 17, fill: 0x2d6cc4 });
    } else {
      button(this, w / 2, y0, '↻  Jogar outra vez', () => this.scene.start('Level', { world }), { w: bw, h: 54 });
      button(this, w / 2, y0 + 62, 'Menu', () => this.scene.start('Title'), { w: bw, h: 46, size: 18, fill: 0x2d6cc4 });
      txt(this, w / 2, groundY + (h - groundY) * 0.5, 'Próximo: Estrada do Leite — em breve', Math.min(18, 15 * u), { color: '#FFE0B2' });
    }

    this.add.particles(0, 0, 'faisca', {
      x: { min: 0, max: w }, y: -10, speedY: { min: 80, max: 200 }, speedX: { min: -40, max: 40 }, lifespan: 4000,
      scale: { min: 0.4, max: 1 }, tint: [0xe8302a, 0xf5c518, 0x2fbf4a, 0x2d6cc4, 0xffffff], frequency: 90, quantity: 1,
    });
    this.input.keyboard.once('keydown-ENTER', () => (world === 1 ? this.scene.start('Intro', { world: 2 }) : this.scene.start('Level', { world })));
    restartOnResize(this, data);
  }
}
