import Phaser from 'phaser';
import { SAVE, persist, WORLD_NAMES, isUnlocked, nextWorld } from './save.js';
import { Sfx, Music, PACK_LABEL } from './sfx.js';
import { txt, button, restartOnResize, backdrop, fmtTime, sparkles, FONT, BODY_FONT } from './common.js';
import { preloadGame, preloadIntro, makeAnims, INTRO } from './assets.js';

// Barra de carregamento simples (usada no arranque e antes da intro).
function loadingBar(scene, label) {
  const { width: w, height: h } = scene.scale;
  const bw = Math.min(320, w * 0.7);
  const g = scene.add.graphics();
  const t = scene.add.text(w / 2, h / 2 - 34, label, { fontFamily: FONT, fontSize: '22px', color: '#FFD43B', stroke: '#1C1410', strokeThickness: 5 }).setOrigin(0.5);
  const draw = (v) => {
    g.clear();
    g.fillStyle(0x000000, 0.45).fillRoundedRect(w / 2 - bw / 2 - 4, h / 2 - 4, bw + 8, 26, 13);
    g.fillStyle(0xc4452d).fillRoundedRect(w / 2 - bw / 2, h / 2, Math.max(18, bw * v), 18, 9);
    g.fillStyle(0xffffff, 0.35).fillRoundedRect(w / 2 - bw / 2 + 4, h / 2 + 3, Math.max(8, bw * v - 8), 5, 3);
    g.lineStyle(3, 0xffd43b).strokeRoundedRect(w / 2 - bw / 2 - 4, h / 2 - 4, bw + 8, 26, 13);
  };
  draw(0);
  scene.load.on('progress', draw);
  scene.load.once('complete', () => { g.destroy(); t.destroy(); });
}

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    loadingBar(this, 'A carregar…');
    preloadGame(this);
  }
  create() {
    makeAnims(this);
    // a fonte do título tem de estar pronta antes de criar textos
    const font = document.fonts && document.fonts.load ? document.fonts.load('32px "Luckiest Guy"') : Promise.resolve();
    Promise.race([font, new Promise((r) => setTimeout(r, 2500))]).catch(() => {}).then(() => this.scene.start('Title'));
  }
}

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    Music.stop();
    const { width: w, height: h } = this.scale;
    const groundY = Math.round(h * 0.8);
    backdrop(this, 'ilha', w, h, groundY);
    const u = Math.min(w / 390, h / 700);
    this.btns = {};

    const lw = Math.min(w * 0.86, 470, h * 0.5);
    const lh = lw * (320 / 900);
    const logo = this.add.image(w / 2, 10 + lh / 2, 'logo').setDisplaySize(lw, lh);
    this.tweens.add({ targets: logo, angle: { from: -1.5, to: 1.5 }, yoyo: true, repeat: -1, duration: 1400, ease: 'Sine.inOut' });
    const subY = 10 + lh + 6;
    txt(this, w / 2, subY, 'A REVOLTA DAS VACAS', Math.min(22, 18 * u), { color: '#FFD43B' });

    const ms = (h * 0.15) / 128;
    const mim = this.add.sprite(w * 0.5, groundY + 6, 'mimosa', 0).setOrigin(0.5, 1).setScale(ms).play('idle');
    this.tweens.add({ targets: mim, y: groundY - 8 * u, yoyo: true, repeat: -1, duration: 600, ease: 'Sine.inOut' });
    this.add.image(w * 0.5 + 60 * ms * 2, groundY + 4, 'cogumelo').setOrigin(0.5, 1).setScale(ms * 0.9);

    const go = (world) => this.scene.start(world === 1 && SAVE.introSeen ? 'Level' : 'Intro', { world });
    const by = Math.max(h * 0.29, subY + 46);
    const bw = Math.min(320, w * 0.8);
    const half = (bw - 10) / 2;
    const nw = nextWorld();
    const allDone = SAVE.world1.done && SAVE.world2.done;
    this.btns.play = button(this, w / 2, by, allDone ? 'JOGAR' : `JOGAR · MUNDO ${nw}`, () => go(nw), { w: bw, h: 60, size: 26 });

    // seleção de mundos
    txt(this, w / 2, by + 50, 'MUNDOS', 16, { color: '#FFD43B' });
    const w1 = SAVE.world1, w2 = SAVE.world2;
    this.btns.world1 = button(this, w / 2 - half / 2 - 5, by + 88, `1 · ${WORLD_NAMES[1]}${w1.done ? ' ✓' : ''}`, () => go(1), { w: half, h: 46, size: 15, fill: 0x3a8f3e });
    const unlocked2 = isUnlocked(2);
    this.btns.world2 = button(this, w / 2 + half / 2 + 5, by + 88, unlocked2 ? `2 · ${WORLD_NAMES[2]}${w2.done ? ' ✓' : ''}` : '2 · bloqueado', () => {
      if (unlocked2) go(2); else this.flash('Acaba a Ilha Verde para abrir A Quinta.');
    }, { w: half, h: 46, size: 15, fill: unlocked2 ? 0x3a8f3e : 0x777777 });
    const stat = (ws) => (ws.done ? `trevos ${ws.bestClovers} · ${fmtTime(ws.bestTime)}` : '—');
    txt(this, w / 2 - half / 2 - 5, by + 124, stat(w1), 12, { color: '#FFFFFF' });
    txt(this, w / 2 + half / 2 + 5, by + 124, unlocked2 ? stat(w2) : 'acaba o Mundo 1', 12, { color: '#FFFFFF' });

    this.btns.sound = button(this, w / 2 - half / 2 - 5, by + 166, `Som: ${PACK_LABEL[SAVE.soundPack]}`, () => {
      Sfx.cyclePack(); this.btns.sound.label.setText(`Som: ${PACK_LABEL[SAVE.soundPack]}`);
    }, { w: half, h: 44, size: 15, fill: 0x2d6cc4 });
    this.btns.easy = button(this, w / 2 + half / 2 + 5, by + 166, `Modo fácil: ${SAVE.easy ? 'sim' : 'não'}`, () => {
      SAVE.easy = !SAVE.easy; persist(); this.btns.easy.label.setText(`Modo fácil: ${SAVE.easy ? 'sim' : 'não'}`);
    }, { w: half, h: 44, size: 15, fill: 0x2d6cc4 });

    const powers = [SAVE.doubleJump && 'duplo salto', SAVE.dash && 'arranque'].filter(Boolean);
    const infoY = groundY + (h - groundY) * 0.28;
    txt(this, w / 2, infoY, powers.length ? `Poderes: ${powers.join(' · ')}` : 'Mundos 3 a 5: em breve', Math.min(17, 14 * u));
    if (powers.length) txt(this, w / 2, infoY + 22 * u, 'Mundos 3 a 5: em breve', Math.min(14, 12 * u), { color: '#FFE0B2' });
    const intro = txt(this, w * 0.27, h - 16 * u, '▶ Ver a intro', Math.min(15, 13 * u), { color: '#FFFFFF' }).setInteractive({ useHandCursor: true });
    intro.on('pointerup', () => this.scene.start('Intro', { world: 1, replay: true }));
    const priv = txt(this, w * 0.7, h - 16 * u, 'Privacidade', Math.min(15, 13 * u), { color: '#FFE0B2' }).setInteractive({ useHandCursor: true });
    priv.on('pointerup', () => { window.location.href = `${import.meta.env.BASE_URL}privacidade/`; });
    this.msg = txt(this, w / 2, by + 214, '', 15, { color: '#FFD43B' });

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

// ---------------- Intro do Mundo 1: "A Noite dos Cogumelos" (6 painéis animados, ≈21 s) ----------------
const PANEL_MS = [3000, 3000, 3500, 4000, 3500, 4000];
const CAPTIONS = [
  'Noite de trovoada na Ilha Verde. A manada dorme… muuuito descansada.',
  'Um clarão! Não era um raio: era uma nave a semear cogumelos que brilham no escuro.',
  'PLOP! As manas provam… e os olhos acendem-se. A Mimosa? Come o MAIOR de todos. Claro.',
  'Chegam os discos voadores e — FZZZUUUM! — as manas sobem pelos raios verdes!',
  'A Mimosa (e o cogumelo gigante) pesa demais para o raio. Escorrega, cai… e aterra DE PÉ. Em duas patas!',
  'As naves largam as manas nas terras do Rei Queijo. A Mimosa aperta a bandana: ninguém ordenha a família dela!',
];
// quando cada camada "salta" (ms desde o início do painel)
const POP_AT = { intro1_word: 800, intro2_word: 300, intro3_word: 200, intro4_b1: 600, intro4_b2: 1300, intro5_bubble: 300, intro5_word: 1200, intro6_bubble: 1000 };
// sons de cada painel: [ms, nome, opções]
const CUES = [
  [[0, 'beam', { volume: 0.15, rate: 0.55 }], [800, 'boom']],
  [[300, 'zap'], [600, 'plop'], [750, 'plop'], [900, 'plop']],
  [[200, 'plop'], [1000, 'power'], [1700, 'moo']],
  [[0, 'beam'], [400, 'beam'], [800, 'moo', { detune: -300 }], [1600, 'moo', { detune: 300 }]],
  [[100, 'fall'], [1200, 'stomp'], [1250, 'boom', { volume: 0.4 }]],
  [[600, 'check'], [1100, 'win']],
];

// ---------------- Intro do Mundo 2: diálogo curto ----------------
const STORY2 = [
  ['A Quinta. Tratores, cercas elétricas e agricultores rabugentos.', 0],
  ['As manas estão fechadas no estábulo, presas à Super Ordenhadeira 3000.', 0],
  ['Ordenha automática? Nem pensar. Vou abrir aquilo tudo!', 1],
  ['Dizem que há uma ferradura-turbo algures na quinta…', 2],
  ['Então vamos a correr. Mana Estrela, fica de vigia!', 1],
];

export class IntroScene extends Phaser.Scene {
  constructor() { super('Intro'); }
  init(data) { this.world = (data && data.world) || 1; }
  preload() {
    if (this.world !== 1) return;
    loadingBar(this, 'A preparar a intro…');
    preloadIntro(this);
  }
  create() {
    const { width: w, height: h } = this.scale;
    this.done = false;
    this.btns = {};
    if (this.world === 1) this.cutscene(w, h); else this.dialog(w, h);
    this.btns.skip = button(this, w - 80, 36, 'Saltar ▸', () => this.finish(), { w: 130, h: 44, size: 17, fill: 0x8a3ff0 });
    this.input.on('pointerup', () => this.next()); // qualquer toque avança
    this.input.keyboard.on('keydown-SPACE', () => this.next());
    this.input.keyboard.on('keydown-ENTER', () => this.next());
    this.input.keyboard.on('keydown-ESC', () => this.finish());
    restartOnResize(this, { world: this.world });
  }

  // ----- cutscene -----
  cutscene(w, h) {
    this.cameras.main.setBackgroundColor('#0a0628');
    this.portrait = w / h < 1.15;
    this.capH = this.portrait ? Math.min(190, h * 0.24) : Math.min(124, h * 0.26);
    this.stage = this.add.container(0, 0);
    this.capBox = this.add.graphics();
    this.capNum = txt(this, 0, 0, '1', 26);
    this.capText = this.add.text(0, 0, '', {
      fontFamily: FONT, fontSize: `${Math.round(this.portrait ? Math.min(20, w / 19) : Math.min(26, w / 40))}px`, color: '#FFFFFF', stroke: '#1C1410', strokeThickness: 5,
      align: 'center', wordWrap: { width: Math.min(w - 70, 1100) }, lineSpacing: 4,
    }).setOrigin(0.5);
    txt(this, 16, 36, 'MUNDO 1 · ILHA VERDE', 16, { color: '#FFD43B' }).setOrigin(0, 0.5);
    this.dots = this.add.graphics();
    this.rainTex();
    this.idx = -1;
    this.next();
  }

  rainTex() {
    if (this.textures.exists('chuva')) return;
    const g = this.make.graphics({}, false);
    g.lineStyle(2, 0xbfe3ff, 0.8).lineBetween(6, 0, 0, 18);
    g.generateTexture('chuva', 8, 20); g.destroy();
  }

  panel(i) {
    const { width: w, height: h } = this.scale;
    const P = INTRO[i];
    this.tweens.killAll();
    if (this.panelTimers) this.panelTimers.forEach((t) => t.remove());
    this.panelTimers = [];
    if (this.rain) { this.rain.destroy(); this.rain = null; }
    this.stage.removeAll(true);
    const at = (ms, fn) => this.panelTimers.push(this.time.delayedCall(ms, fn));

    // enquadramento: paisagem = cobre o ecrã; retrato = painel grande em cima com panorâmica lenta
    const areaH = h - this.capH - (this.portrait ? 64 : 0);
    const s = this.portrait ? Math.max(w / 1280, areaH / 800) : Math.max(w / 1280, h / 800);
    const pw = 1280 * s;
    const oy = this.portrait ? 64 + (areaH - 800 * s) / 2 : (h - 800 * s) / 2 - (this.capH * 0.25);
    this.stage.setScale(s).setPosition((w - pw) / 2, oy);
    if (this.portrait && pw > w) {
      const dir = i % 2 ? -1 : 1;
      this.stage.x = dir > 0 ? 0 : w - pw;
      this.tweens.add({ targets: this.stage, x: dir > 0 ? w - pw : 0, duration: PANEL_MS[i] + 600, ease: 'Sine.inOut' });
    } else {
      this.tweens.add({ targets: this.stage, scale: s * 1.035, x: (w - pw * 1.035) / 2, y: oy - 800 * s * 0.0175, duration: PANEL_MS[i] + 600, ease: 'Sine.out' });
    }

    for (const l of P.layers) {
      const im = this.add.image(l.x + l.w / 2, l.y + l.h / 2, l.key);
      this.stage.add(im);
      const fx = l.fx;
      if (fx === 'pop') {
        im.setScale(0);
        at(POP_AT[l.key] || 300, () => this.tweens.add({ targets: im, scale: { from: 0, to: 1 }, duration: 260, ease: 'Back.out', easeParams: [2.4] }));
      } else if (fx === 'bob') {
        this.tweens.add({ targets: im, y: im.y - 8, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.inOut' });
      } else if (fx === 'float') {
        this.tweens.add({ targets: im, y: im.y - 7, yoyo: true, repeat: -1, duration: 620 + (l.x % 300), ease: 'Sine.inOut' });
        this.tweens.add({ targets: im, x: im.x + 4, angle: { from: -4, to: 4 }, yoyo: true, repeat: -1, duration: 900 });
        this.tweens.add({ targets: im, y: `-=${40}`, duration: PANEL_MS[i], ease: 'Sine.in' });
      } else if (fx === 'beam') {
        im.setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.55);
        this.tweens.add({ targets: im, alpha: 1, yoyo: true, repeat: -1, duration: 380, ease: 'Sine.inOut' });
      } else if (fx === 'pulse') {
        im.setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.6);
        this.tweens.add({ targets: im, alpha: 1, scale: 1.08, yoyo: true, repeat: -1, duration: 500, ease: 'Sine.inOut' });
      } else if (fx === 'bolt') {
        im.setAlpha(0);
        at(800, () => { im.setAlpha(1); this.cameras.main.flash(150, 255, 255, 255); this.cameras.main.shake(150, 0.012);
          this.tweens.add({ targets: im, alpha: 0, duration: 120, yoyo: true, repeat: 2, onComplete: () => im.setAlpha(0) }); });
      } else if (fx === 'zap') {
        im.setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
        at(300, () => { im.setAlpha(1); this.cameras.main.flash(150, 230, 255, 200); this.tweens.add({ targets: im, alpha: 0, duration: 90, yoyo: true, repeat: 3, onComplete: () => im.setAlpha(0) }); });
      } else if (fx === 'grow') {
        im.setOrigin(0.5, 1).setPosition(l.x + l.w / 2, l.y + l.h).setScale(0);
        const k = Number(l.key.slice(-1)) - 1;
        at(600 + k * 150, () => this.tweens.add({ targets: im, scale: 1, duration: 300, ease: 'Back.out', easeParams: [2] }));
      } else if (fx === 'chomp') {
        im.setOrigin(0.5, 1).setPosition(l.x + l.w / 2, l.y + l.h);
        this.tweens.add({ targets: im, scaleY: 0.96, scaleX: 1.03, yoyo: true, repeat: -1, duration: 160 });
      } else if (fx === 'land') {
        im.setAlpha(0);
        at(1200, () => { im.setAlpha(1).setScale(0.6); this.tweens.add({ targets: im, scale: 1, duration: 200, ease: 'Back.out' }); });
      } else if (fx === 'drop') {
        im.setOrigin(0.5, 1).setPosition(l.x + l.w / 2, l.y + l.h);
        const y1 = im.y;
        im.y = y1 - 560; im.angle = -20;
        this.tweens.add({ targets: im, y: y1, angle: 0, duration: 1150, delay: 50, ease: 'Quad.in',
          onComplete: () => { this.cameras.main.shake(150, 0.016); this.tweens.add({ targets: im, scaleX: 1.12, scaleY: 0.88, duration: 90, yoyo: true }); } });
      } else if (fx === 'flyaway') {
        this.tweens.add({ targets: im, x: im.x + 420, y: im.y - 130, scale: 0.35, duration: PANEL_MS[i], ease: 'Sine.in' });
      } else if (fx === 'hop') {
        im.setOrigin(0.5, 1).setPosition(l.x + l.w / 2, l.y + l.h);
        this.tweens.add({ targets: im, y: im.y - 16, yoyo: true, repeat: -1, duration: 330, ease: 'Sine.out' });
      }
    }
    // extras baratos: chuva, zzz, nham
    if (i <= 1) {
      this.rain = this.add.particles(0, 0, 'chuva', { x: { min: -100, max: 1380 }, y: -20, speedY: { min: 900, max: 1200 }, speedX: -280, lifespan: 1000, frequency: i === 0 ? 8 : 16, alpha: 0.7, rotate: 17 });
      this.stage.add(this.rain);
    }
    if (i === 0) for (const [x, y, t] of [[560, 420, 'zzz'], [940, 430, 'zZz']]) {
      const z = txt(this, x, y, t, 38, { color: '#FFFFFF' }).setAngle(-8); this.stage.add(z);
      this.tweens.add({ targets: z, y: y - 40, alpha: { from: 1, to: 0 }, repeat: -1, duration: 1400 });
    }
    if (i === 2) for (const [x, d] of [[330, 500], [1000, 900]]) {
      const n = txt(this, x, 400, 'nham', 32, { color: '#B6FF6A' }).setScale(0); this.stage.add(n);
      at(d, () => this.tweens.add({ targets: n, scale: 1, duration: 220, ease: 'Back.out', yoyo: true, hold: 700, repeat: 1 }));
    }
    for (const [ms, name, opts] of CUES[i]) at(ms, () => Sfx.play(name, opts));
    if (i === 5) at(2000, () => Music.play('theme'));
    at(PANEL_MS[i], () => this.next());
    this.caption(i);
  }

  caption(i) {
    const { width: w, height: h } = this.scale;
    const ch = this.capH, cw = Math.min(w - 20, 1200), cx = w / 2, cy = h - ch / 2 - 8;
    const g = this.capBox.clear();
    g.fillStyle(0x1c1410, 0.6).fillRoundedRect(cx - cw / 2 + 2, cy - ch / 2 + 6, cw, ch, 20);
    g.fillStyle(0xf09a12).fillRoundedRect(cx - cw / 2, cy - ch / 2, cw, ch, 20);
    g.fillStyle(0xffd43b).fillRoundedRect(cx - cw / 2, cy - ch / 2, cw, ch * 0.5, { tl: 20, tr: 20, bl: 0, br: 0 });
    g.lineStyle(4, 0x1c1410).strokeRoundedRect(cx - cw / 2, cy - ch / 2, cw, ch, 20);
    g.fillGradientStyle(0xa86af5, 0xa86af5, 0x4a1a9e, 0x4a1a9e, 1).fillRoundedRect(cx - cw / 2 + 8, cy - ch / 2 + 8, cw - 16, ch - 16, 14);
    g.lineStyle(2.5, 0x1c1410).strokeRoundedRect(cx - cw / 2 + 8, cy - ch / 2 + 8, cw - 16, ch - 16, 14);
    g.fillStyle(0xffffff, 0.18).fillRoundedRect(cx - cw / 2 + 16, cy - ch / 2 + 12, cw - 32, (ch - 16) * 0.28, 10);
    g.fillStyle(0xc4452d).fillCircle(cx - cw / 2 + 26, cy - ch / 2 + 4, 22).lineStyle(4, 0x1c1410).strokeCircle(cx - cw / 2 + 26, cy - ch / 2 + 4, 22);
    this.capNum.setText(String(i + 1)).setPosition(cx - cw / 2 + 26, cy - ch / 2 + 6);
    this.capText.setPosition(cx, cy).setWordWrapWidth(cw - 48);
    // dots de progresso
    this.dots.clear();
    for (let k = 0; k < 6; k++) { this.dots.fillStyle(k === i ? 0xffd43b : 0xffffff, k === i ? 1 : 0.4).fillCircle(w / 2 - 50 + k * 20, this.portrait ? 64 : 22, k === i ? 6 : 4); }
    // máquina de escrever (≈35 car./s)
    const full = CAPTIONS[i];
    if (this.typer) this.typer.remove();
    let n = 0;
    this.capText.setText('');
    this.typer = this.time.addEvent({ delay: 28, repeat: full.length - 1, callback: () => { n++; this.capText.setText(full.slice(0, n)); } });
  }

  next() {
    if (this.done) return;
    if (this.world !== 1) return this.nextLine();
    this.idx++;
    if (this.idx >= INTRO.length) return this.finish();
    this.panel(this.idx);
  }

  // ----- diálogo do Mundo 2 -----
  dialog(w, h) {
    const groundY = Math.round(h * 0.74);
    backdrop(this, 'quinta', w, h, groundY);
    const s = Math.max(0.9, Math.min(w, h) / 300);
    const boxW = Math.min(w - 32, 640);
    const g = this.add.graphics();
    g.fillStyle(0xffd43b).fillRoundedRect(w / 2 - boxW / 2, 74, boxW, 104, 18).lineStyle(4, 0x1c1410).strokeRoundedRect(w / 2 - boxW / 2, 74, boxW, 104, 18);
    g.fillGradientStyle(0xa86af5, 0xa86af5, 0x4a1a9e, 0x4a1a9e, 1).fillRoundedRect(w / 2 - boxW / 2 + 7, 81, boxW - 14, 90, 13);
    this.who = txt(this, w / 2 - boxW / 2 + 18, 80, '', 16, { color: '#FFD43B' }).setOrigin(0, 0);
    this.say = this.add.text(w / 2, 134, '', { fontFamily: BODY_FONT, fontSize: `${Math.min(20, w / 21)}px`, color: '#FFFFFF', align: 'center', wordWrap: { width: boxW - 32 }, fontStyle: 'bold', stroke: '#1C1410', strokeThickness: 3 }).setOrigin(0.5);
    txt(this, 16, 36, `MUNDO 2 · ${WORLD_NAMES[2].toUpperCase()}`, 16, { color: '#FFD43B' }).setOrigin(0, 0.5);
    const mim = this.add.sprite(w * 0.2, groundY + 4, 'mimosa', 0).setOrigin(0.5, 1).setScale(s * 0.5).play('idle');
    this.tweens.add({ targets: mim, y: groundY - 8, yoyo: true, repeat: -1, duration: 400 });
    const tr = this.add.sprite(w + 200, groundY + 6, 'trator', 0).setOrigin(0.5, 1).setScale(Math.min(0.5, s * 0.22)).play('trator_drive');
    this.tweens.add({ targets: tr, x: -220, duration: 6000, repeat: -1, delay: 400 });
    const far = this.add.sprite(w * 0.78, groundY + 4, 'agricultor', 0).setOrigin(0.5, 1).setScale(s * 0.45).setFlipX(true).play('farmer_walk');
    this.tweens.add({ targets: far, x: w * 0.7, yoyo: true, repeat: -1, duration: 1600 });
    this.lines = STORY2;
    this.idx = -1;
    this.nextLine();
  }

  nextLine() {
    this.idx++;
    if (this.idx >= this.lines.length) return this.finish();
    const [line, who] = this.lines[this.idx];
    this.who.setText(who === 1 ? 'MIMOSA' : who === 2 ? 'MANA ESTRELA' : 'NARRADOR');
    this.say.setText(this.idx === this.lines.length - 1 ? `${line}\n(toca para começar)` : line);
  }

  finish() {
    if (this.done) return;
    this.done = true;
    if (this.world === 1) { SAVE.introSeen = true; persist(); }
    this.cameras.main.fadeOut(300, 28, 20, 16);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Level', { world: this.world }));
  }
}

export class CompleteScene extends Phaser.Scene {
  constructor() { super('Complete'); }
  create(data) {
    Music.stop();
    const { width: w, height: h } = this.scale;
    const groundY = Math.round(h * 0.8);
    const { world = 1, clovers = 0, total = 0, time = 0, record = false } = data || {};
    backdrop(this, world === 1 ? 'ilha' : 'quinta', w, h, groundY);
    const u = Math.min(w / 390, h / 700);
    this.btns = {};
    const title = txt(this, w / 2, h * 0.09, 'NÍVEL CONCLUÍDO!', Math.min(54, 40 * u), { color: '#FFD43B', strokeThickness: 10 });
    this.tweens.add({ targets: title, scale: { from: 0.4, to: 1 }, duration: 500, ease: 'Back.out' });
    txt(this, w / 2, h * 0.09 + 46 * u, world === 1 ? 'A Mana Estrela está livre!' : 'A Ordenhadeira foi à vida! Manas livres!', Math.min(22, 18 * u), { color: '#FFFFFF' });

    const panelW = Math.min(360, w * 0.86), py = h * 0.24;
    const g = this.add.graphics();
    g.fillStyle(0xffd43b).fillRoundedRect(w / 2 - panelW / 2 - 6, py - 6, panelW + 12, 152, 20).lineStyle(4, 0x1c1410).strokeRoundedRect(w / 2 - panelW / 2 - 6, py - 6, panelW + 12, 152, 20);
    g.fillGradientStyle(0xa86af5, 0xa86af5, 0x4a1a9e, 0x4a1a9e, 1).fillRoundedRect(w / 2 - panelW / 2, py, panelW, 140, 16);
    this.add.sprite(w / 2 - panelW / 2 + 40, py + 36, 'trevo', 0).setScale(0.8).play('trevo_spin');
    txt(this, w / 2 + 10, py + 36, `Trevos: ${clovers} / ${total}`, 24);
    txt(this, w / 2, py + 76, `Tempo: ${fmtTime(time)}${record ? '  · recorde!' : ''}`, 21, { color: record ? '#FFD43B' : '#FFFFFF' });
    txt(this, w / 2, py + 112, world === 1 ? 'Duplo salto: guardado ✓' : 'Arranque: guardado ✓', 17, { color: '#B6FF8A' });

    const s = (h * 0.14) / 128;
    const herd = world === 1 ? [['mimosa', 6], ['mana', 1]] : [['mimosa', 6], ['mana', 1], ['mana2', 1], ['mana3', 1], ['mana4', 1]];
    const step = Math.min(90 * s, (w - 60) / herd.length);
    herd.forEach(([key, f], i) => {
      const x = w / 2 + (i - (herd.length - 1) / 2) * step;
      const c = this.add.image(x, groundY + 6, key, f).setOrigin(0.5, 1).setScale(s).setFlipX(i > 0);
      this.tweens.add({ targets: c, y: groundY - 30, yoyo: true, repeat: -1, duration: 380, delay: i * 120, ease: 'Sine.out' });
    });

    const bw = Math.min(280, w * 0.74);
    const y0 = h * 0.24 + 190;
    if (world === 1) {
      this.btns.next = button(this, w / 2, y0, 'PRÓXIMO: A QUINTA ▸', () => this.scene.start('Intro', { world: 2 }), { w: bw, h: 56, size: 20 });
      this.btns.replay = button(this, w / 2, y0 + 64, '↻ Jogar outra vez', () => this.scene.start('Level', { world }), { w: bw, h: 46, size: 17, fill: 0x3a8f3e });
      this.btns.menu = button(this, w / 2, y0 + 118, 'Menu', () => this.scene.start('Title'), { w: bw, h: 44, size: 17, fill: 0x2d6cc4 });
    } else {
      this.btns.replay = button(this, w / 2, y0, '↻ Jogar outra vez', () => this.scene.start('Level', { world }), { w: bw, h: 56 });
      this.btns.menu = button(this, w / 2, y0 + 64, 'Menu', () => this.scene.start('Title'), { w: bw, h: 46, size: 18, fill: 0x2d6cc4 });
      txt(this, w / 2, groundY + (h - groundY) * 0.5, 'Próximo: Estrada do Leite — em breve', Math.min(18, 15 * u), { color: '#FFE0B2' });
    }
    this.add.particles(0, 0, 'faisca', {
      x: { min: 0, max: w }, y: -10, speedY: { min: 80, max: 200 }, speedX: { min: -40, max: 40 }, lifespan: 4000, rotate: { min: 0, max: 360 },
      scale: { min: 0.3, max: 0.8 }, tint: [0xe8302a, 0xffd43b, 0x3fdc4f, 0x2a7cf0, 0xffffff], frequency: 90, quantity: 1, blendMode: 'ADD',
    });
    this.time.delayedCall(300, () => sparkles(this, w / 2, h * 0.09, { n: 14, spread: 140, scale: 0.9, ms: 700 }));
    this.input.keyboard.once('keydown-ENTER', () => (world === 1 ? this.scene.start('Intro', { world: 2 }) : this.scene.start('Level', { world })));
    restartOnResize(this, data);
  }
}
