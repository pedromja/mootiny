import Phaser from 'phaser';
import { SAVE, persist } from './save.js';
import { Sfx } from './sfx.js';
import { txt } from './common.js';
import { WORLDS, GT } from './worlds.js';
import { Boss } from './boss.js';

const BOTTOM = 780;
const RUN = 250;
const DASH_V = 680;
const DASH_MS = 250;

export class LevelScene extends Phaser.Scene {
  constructor() { super('Level'); }

  create(data) {
    this.world = WORLDS[(data && data.world) || 1];
    const L = this.world;
    // A cena é reutilizada entre mundos: limpar tudo o que vem do nível anterior.
    this.boss = null;
    this.gateZone = null;
    this.gate = null;
    this.mana = null;
    this.hayPlaced = false;
    this.dashDir = 1;
    this.dashStart = 0;
    this.W = L.W;
    this.respawning = false;
    this.paused = false;
    this.finished = false;
    this.hearts = 3;
    this.fallsInRow = 0;
    this.clovers = 0;
    this.totalClovers = L.clovers.length;
    this.jumpsUsed = 0; this.jumpAt = 0;
    this.lastGround = -9999;
    this.jumpBuffer = -9999;
    this.invulnUntil = 0;
    this.hurtLock = 0;
    this.elapsed = 0;
    this.dashing = false;
    this.dashAvail = true;
    this.dashReadyAt = 0;
    this.checkpoint = { x: 90, y: GT - 40 };
    this.isTouch = this.sys.game.device.input.touch;
    this.history = [];
    this.herd = [];
    if (L.id >= 2 && !SAVE.doubleJump) { SAVE.doubleJump = true; persist(); } // ganho no Mundo 1

    this.physics.world.setBounds(0, -800, this.W, 2400);
    this.physics.world.setBoundsCollision(true, true, false, false);
    this.cameras.main.setBackgroundColor(L.theme === 'quinta' ? '#ffd9a0' : '#7cc4ff');

    if (L.theme === 'quinta') this.drawFarmBackground(); else this.drawIslandBackground();
    this.buildLevel();

    const p = this.player = this.physics.add.sprite(this.checkpoint.x, this.checkpoint.y, 'mimosa_idle');
    p.body.setSize(24, 54).setOffset(12, 10);
    p.setCollideWorldBounds(true).setDepth(10);
    p.body.setMaxVelocityY(900);

    this.physics.add.collider(p, this.solids);
    // os callbacks normalizam a ordem (a Mimosa é sempre this.player)
    const other = (a, b) => (a === p ? b : a);
    this.physics.add.collider(p, this.plats, null, (a, b) => { const plat = other(a, b); return p.body.velocity.y >= 0 && p.body.bottom <= plat.body.top + 14; });
    this.physics.add.collider(p, this.hayWalls, null, (a, b) => { if (this.dashing) { this.breakWall(other(a, b)); return false; } return true; });
    this.physics.add.collider(this.walkers, this.solids);
    this.physics.add.collider(this.tractors, this.solids);
    this.physics.add.overlap(p, this.walkers, (a, b) => this.touchWalker(other(a, b)));
    this.physics.add.overlap(p, this.tractors, (a, b) => this.hurt(other(a, b).x));
    this.physics.add.overlap(p, this.thistles, () => this.hurt());
    this.physics.add.overlap(p, this.efenceZones, (a, b) => { const z = other(a, b); if (z.fence.on) { if (this.time.now >= this.invulnUntil) Sfx.play('zap'); this.hurt(z.x); } });
    this.physics.add.overlap(p, this.cloverGroup, (a, b) => this.collect(other(a, b)));
    this.physics.add.overlap(p, this.power, () => this.getPower());
    this.physics.add.overlap(p, this.flags, (a, b) => this.reachCheckpoint(other(a, b)));
    if (this.gateZone) this.physics.add.overlap(p, this.gateZone, () => this.finish());

    const cam = this.cameras.main;
    cam.setBounds(0, -700, this.W, BOTTOM + 700);
    cam.startFollow(p, true, 0.12, 0.12);
    this.fitCamera();
    this.onResize = () => this.fitCamera();
    this.scale.on('resize', this.onResize);
    this.events.once('shutdown', () => this.scale.off('resize', this.onResize));

    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = this.input.keyboard.addKeys({ a: K.A, d: K.D, left: K.LEFT, right: K.RIGHT, space: K.SPACE, up: K.UP, w: K.W, shift: K.SHIFT, k: K.K });
    this.input.keyboard.addCapture([K.SPACE, K.UP, K.LEFT, K.RIGHT]);

    this.scene.launch('Hud');
    this.hud = this.scene.get('Hud');
    this.events.once('shutdown', () => this.scene.stop('Hud'));
    if (SAVE.easy) this.applyEasy(false);
    cam.fadeIn(300, 28, 20, 16);
  }

  fitCamera() {
    const { width: w, height: h } = this.scale;
    const z = Math.min(h / 560, w / 430);
    const cam = this.cameras.main;
    cam.setZoom(z);
    cam.setFollowOffset(0, h / z > 700 ? 0 : 90);
  }

  // ---------- cenário ----------
  drawIslandBackground() {
    const sky = this.add.graphics().setScrollFactor(0, 1).setDepth(-10);
    sky.fillGradientStyle(0x4aa3f0, 0x4aa3f0, 0xcdeeff, 0xcdeeff, 1);
    sky.fillRect(-3000, -800, 9000, GT - 80 + 800);
    sky.fillStyle(0xcdeeff); sky.fillRect(-3000, GT - 80, 9000, 400);
    const sea = this.add.graphics().setScrollFactor(0.1, 1).setDepth(-9);
    sea.fillStyle(0x2f8fd6); sea.fillRect(-3000, GT - 90, 9000, 300);
    sea.fillStyle(0x7fc3f0); for (let x = -3000; x < 6000; x += 90) sea.fillRect(x, GT - 80, 40, 3);
    this.clouds();
    const far = this.add.graphics().setScrollFactor(0.3, 1).setDepth(-7);
    far.fillStyle(0x8fd17e);
    for (let x = -400; x < 4200; x += 420) far.fillEllipse(x, GT - 30, 620, 260);
    const near = this.add.graphics().setScrollFactor(0.55, 1).setDepth(-6);
    near.fillStyle(0x66bb55);
    for (let x = -300; x < 5200; x += 520) near.fillEllipse(x + 200, GT + 20, 560, 220);
    near.fillStyle(0xffffff); near.fillRect(900, GT - 170, 30, 110); near.fillStyle(0xe8302a); near.fillRect(900, GT - 140, 30, 18); near.fillRect(896, GT - 182, 38, 14);
    near.fillStyle(0xfff3a0); near.fillRect(905, GT - 196, 20, 14);
  }

  drawFarmBackground() {
    const sky = this.add.graphics().setScrollFactor(0, 1).setDepth(-10);
    sky.fillGradientStyle(0x6fa8e8, 0x6fa8e8, 0xffe0a8, 0xffe0a8, 1);
    sky.fillRect(-3000, -800, 9000, GT - 60 + 800);
    sky.fillStyle(0xffe0a8); sky.fillRect(-3000, GT - 60, 9000, 400);
    this.clouds();
    // campos lavrados
    const far = this.add.graphics().setScrollFactor(0.25, 1).setDepth(-7);
    far.fillStyle(0xc9b458); far.fillRect(-2000, GT - 90, 8000, 300);
    far.fillStyle(0xa8963f); for (let y = GT - 80; y < GT + 50; y += 16) far.fillRect(-2000, y, 8000, 4);
    far.fillStyle(0x9ccf7a); for (let x = -400; x < 3200; x += 500) far.fillEllipse(x, GT - 90, 560, 120);
    // celeiros e silos ao longe
    const mid = this.add.graphics().setScrollFactor(0.5, 1).setDepth(-6);
    for (let x = 200; x < 4000; x += 900) {
      this.barn(mid, x, GT - 40, 0.9);
      mid.fillStyle(0xb0b8c0); mid.fillRect(x + 190, GT - 210, 50, 170); mid.fillStyle(0x8a929a); mid.fillEllipse(x + 215, GT - 210, 50, 30);
    }
    // vedação de madeira decorativa
    const fence = this.add.graphics().setDepth(0);
    fence.fillStyle(0xd8b07a); fence.lineStyle(1.5, 0x1c1410, 0.6);
    for (const [x1, x2, top] of this.world.grounds) {
      if (top !== GT) continue;
      for (let x = x1 + 10; x < x2 - 10; x += 48) { fence.fillRect(x, GT - 44, 7, 44); }
      fence.fillRect(x1 + 6, GT - 38, x2 - x1 - 12, 6); fence.fillRect(x1 + 6, GT - 20, x2 - x1 - 12, 6);
    }
    // interior do estábulo (arena)
    const { ar0, ar1 } = this.world.goal;
    const st = this.add.graphics().setDepth(-1);
    st.fillStyle(0x7a2a20); st.fillRect(ar0, GT - 1100, ar1 - ar0 + 400, 1100);
    st.fillStyle(0x6a2219); for (let x = ar0; x < ar1 + 400; x += 40) st.fillRect(x, GT - 1100, 3, 1100);
    st.fillStyle(0x4a3020); st.fillRect(ar0, GT - 420, ar1 - ar0 + 400, 22); st.fillRect(ar0, GT - 300, ar1 - ar0 + 400, 14);
    st.fillStyle(0xe7c35a); st.fillEllipse(ar0 + 70, GT, 160, 70); st.fillEllipse(ar1 - 60, GT, 150, 60);
    txt(this, (ar0 + ar1) / 2, GT - 326, 'ESTÁBULO · LEITARIA AUTOMÁTICA', 14, { color: '#FFE0B2' }).setDepth(-1);
  }

  barn(g, x, groundY, s) {
    if (!s) return;
    const w = 180 * s, h = 120 * s;
    g.fillStyle(0xb8322a); g.fillRect(x, groundY - h, w, h);
    g.fillTriangle(x - 10 * s, groundY - h, x + w + 10 * s, groundY - h, x + w / 2, groundY - h - 70 * s);
    g.fillStyle(0xffffff); g.fillRect(x + w / 2 - 30 * s, groundY - 70 * s, 60 * s, 70 * s);
    g.fillStyle(0xb8322a); g.fillRect(x + w / 2 - 25 * s, groundY - 65 * s, 50 * s, 65 * s);
    g.lineStyle(4 * s, 0xffffff); g.lineBetween(x + w / 2 - 25 * s, groundY - 65 * s, x + w / 2 + 25 * s, groundY); g.lineBetween(x + w / 2 + 25 * s, groundY - 65 * s, x + w / 2 - 25 * s, groundY);
    g.fillStyle(0xffffff); g.fillRect(x + w / 2 - 14 * s, groundY - h - 40 * s, 28 * s, 22 * s);
  }

  clouds() {
    for (let i = 0; i < 16; i++) {
      this.add.image(i * 330 + Phaser.Math.Between(0, 120), Phaser.Math.Between(-300, 260), 'nuvem')
        .setScrollFactor(0.15, 1).setScale(Phaser.Math.FloatBetween(0.6, 1.3)).setDepth(-8).setAlpha(0.9);
    }
  }

  // ---------- construção ----------
  buildLevel() {
    const L = this.world;
    this.solids = [];
    this.plats = [];
    if (L.theme === 'quinta') {
      // valas de lama: deixam claro que são buracos
      const ditch = this.add.graphics().setDepth(0);
      for (const [x1, x2] of L.pits) {
        ditch.fillGradientStyle(0x5a3d26, 0x5a3d26, 0x1c1410, 0x1c1410, 1);
        ditch.fillRect(x1, GT + 16, x2 - x1, BOTTOM - GT);
        ditch.fillStyle(0x6b4a2e); ditch.fillEllipse((x1 + x2) / 2, GT + 150, (x2 - x1) * 0.8, 24);
      }
    }
    for (const [x1, x2, top] of L.grounds) {
      const w = x2 - x1;
      this.add.tileSprite(x1, top + 20, w, BOTTOM - top, 'terra').setOrigin(0, 0).setDepth(1);
      this.add.tileSprite(x1, top - 4, w, 26, 'relva').setOrigin(0, 0).setDepth(2);
      this.addSolid(x1, top, w, BOTTOM - top + 200);
    }
    for (const [x, y, w] of L.plats) {
      this.add.tileSprite(x, y - 3, w, 20, 'plataforma').setOrigin(0, 0).setDepth(2);
      const z = this.add.zone(x + w / 2, y + 8, w, 16);
      this.physics.add.existing(z, true);
      this.plats.push(z);
    }
    for (const [x, text] of L.signs) {
      let t = text;
      if (t === '@tutorial') t = this.isTouch ? 'Toca à esquerda: ◀ ▶ andar\nToca à direita: saltar' : 'A/D ou ◀ ▶: andar\nEspaço: saltar';
      if (t === '@dash') t = this.isTouch ? 'ARRANQUE: toca na faixa ▶▶\nou 2 toques em ▶ (parte fardos!)' : 'ARRANQUE: Shift ou K\n(parte fardos de feno!)';
      this.sign(x, t);
    }

    // inimigos que andam: latas (W1) e agricultores barrigudos (W2)
    this.walkers = this.physics.add.group();
    for (const [x, min, max] of L.cans) this.addWalker('can', x, min, max);
    for (const [x, min, max] of L.farmers) this.addWalker('farmer', x, min, max);
    // tratores: não se podem pisar
    this.tractors = this.physics.add.group();
    for (const [x, min, max] of L.tractors) {
      const t = this.tractors.create(x, GT - 40, 'trator').setDepth(5);
      t.body.setSize(96, 60).setOffset(8, 10);
      t.minX = min; t.maxX = max; t.dir = -1; t.baseSpeed = 110;
      this.tweens.add({ targets: t, angle: { from: -1.5, to: 1.5 }, yoyo: true, repeat: -1, duration: 120 });
    }
    this.thistles = this.physics.add.staticGroup();
    for (const [x, y] of L.thistles) {
      const t = this.thistles.create(x, y - 14, 'cardo').setDepth(4);
      t.body.setSize(20, 20).setOffset(6, 6);
    }
    // cercas elétricas (liga/desliga com aviso)
    this.efences = [];
    this.efenceZones = [];
    for (const [x, offset] of L.efences) {
      const g = this.add.graphics().setDepth(6);
      const z = this.add.zone(x, GT - 130, 14, 260);
      this.physics.add.existing(z, true);
      const f = { x, offset, g, on: false, warn: false, zone: z, drawn: null };
      z.fence = f;
      this.efences.push(f);
      this.efenceZones.push(z);
    }
    // fardos que só o arranque parte
    this.hayWalls = [];
    for (const x of L.hayWalls) {
      const img = this.add.tileSprite(x - 32, GT - 280, 64, 280, 'feno').setOrigin(0, 0).setDepth(5);
      const z = this.add.zone(x, GT - 140, 64, 280);
      this.physics.add.existing(z, true);
      z.img = img;
      this.hayWalls.push(z);
    }

    this.cloverGroup = this.physics.add.staticGroup();
    for (const [x, y] of L.clovers) {
      const c = this.cloverGroup.create(x, y, 'trevo').setDepth(4);
      this.tweens.add({ targets: c, scaleX: 0.75, yoyo: true, repeat: -1, duration: 500 + (x % 200) });
    }
    const pw = L.power;
    this.power = this.physics.add.staticImage(pw.x, pw.y, pw.type === 'dash' ? 'ferradura' : 'poder').setDepth(4);
    this.tweens.add({ targets: this.power, angle: { from: -8, to: 8 }, yoyo: true, repeat: -1, duration: 600 });
    if (SAVE[pw.type]) this.power.setAlpha(0.45);
    this.flags = this.physics.add.staticGroup();
    for (const [x, y] of L.checkpoints) {
      const f = this.flags.create(x, y - 35, 'bandeira').setDepth(3);
      f.cloth = this.add.image(x, y - 35, 'pano_off').setDepth(3);
    }
    if (L.goal.type === 'gate') this.buildGate(L.goal.x);
    else this.boss = new Boss(this, L.goal.ar0, L.goal.ar1);
    if (L.id === 1) {
      const ad = this.add.graphics().setDepth(1);
      ad.fillStyle(0x6e4527); ad.fillRect(2420 - 4, GT - 240, 8, 90);
      ad.fillStyle(0xffffff); ad.fillRect(2340, GT - 300, 170, 70); ad.lineStyle(3, 0x1c1410); ad.strokeRect(2340, GT - 300, 170, 70);
      txt(this, 2425, GT - 276, 'BEBA LEITE!', 18, { color: '#2D6CC4', stroke: '#fff' }).setDepth(1);
      txt(this, 2425, GT - 250, '(as vacas não foram consultadas)', 9, { color: '#1C1410', stroke: '#fff', strokeThickness: 0 }).setDepth(1);
    }
  }

  addWalker(kind, x, min, max) {
    const isCan = kind === 'can';
    const e = this.walkers.create(x, GT - 34, isCan ? 'can1' : 'agricultor1');
    if (isCan) { e.body.setSize(26, 40).setOffset(5, 4); e.play('can_walk'); e.baseSpeed = 70; }
    else { e.body.setSize(30, 54).setOffset(9, 10); e.play('farmer_walk'); e.baseSpeed = 65; }
    e.kind = kind; e.minX = min; e.maxX = max; e.dir = -1;
    e.setDepth(5);
    return e;
  }

  buildGate(gx) {
    this.gateX = gx;
    const pen = this.add.graphics().setDepth(3);
    pen.fillStyle(0xc89a5c); pen.lineStyle(2, 0x1c1410);
    for (let x = gx + 20; x <= gx + 220; x += 40) { pen.fillRect(x, GT - 64, 10, 64); pen.strokeRect(x, GT - 64, 10, 64); }
    pen.fillRect(gx + 10, GT - 56, 220, 8); pen.strokeRect(gx + 10, GT - 56, 220, 8);
    pen.fillRect(gx + 10, GT - 28, 220, 8); pen.strokeRect(gx + 10, GT - 28, 220, 8);
    this.mana = this.add.image(gx + 130, GT, 'mana_sleepy').setOrigin(0.5, 1).setFlipX(true).setDepth(2);
    this.gate = this.add.image(gx, GT, 'portao').setOrigin(0, 1).setDepth(4);
    this.gateZone = this.add.zone(gx - 4, GT - 300, 30, 600);
    this.physics.add.existing(this.gateZone, true);
    txt(this, gx + 120, GT - 110, 'MANA ESTRELA', 14, { color: '#FFF3A0' }).setDepth(4);
  }

  addSolid(x, y, w, h) {
    const z = this.add.zone(x + w / 2, y + h / 2, w, h);
    this.physics.add.existing(z, true);
    this.solids.push(z);
    return z;
  }

  sign(x, text) {
    this.add.image(x, GT - 26, 'placa').setDepth(2).setScale(1.1);
    txt(this, x, GT - 120, text, 13, { color: '#FFFFFF', backgroundColor: '#1C1410AA', padding: { x: 8, y: 6 }, strokeThickness: 0 }).setDepth(3);
  }

  applyEasy(announce = true) {
    if (!this.hayPlaced) {
      this.hayPlaced = true;
      for (const [x1, x2] of this.world.pits) {
        const w = x2 - x1;
        this.add.tileSprite(x1, GT + 8, w, 40, 'feno').setOrigin(0, 0).setDepth(2);
        const z = this.addSolid(x1, GT + 8, w, 400);
        this.physics.add.collider(this.player, z);
        this.physics.add.collider(this.walkers, z);
      }
    }
    this.walkers.getChildren().forEach((c) => { c.baseSpeed = c.kind === 'can' ? 40 : 40; });
    this.tractors.getChildren().forEach((t) => { t.baseSpeed = 70; });
    if (this.boss) this.boss.easy = true;
    if (announce) this.hud.toast('Modo fácil: fardos de feno nos buracos e inimigos mais lentos.');
  }

  // ---------- ciclo ----------
  readControls() {
    const k = this.keys;
    const t = (this.hud && this.hud.touch) || {};
    const left = k.a.isDown || k.left.isDown || t.left;
    const right = k.d.isDown || k.right.isDown || t.right;
    const held = k.space.isDown || k.up.isDown || k.w.isDown || t.jumpHeld;
    let pressed = Phaser.Input.Keyboard.JustDown(k.space) || Phaser.Input.Keyboard.JustDown(k.up) || Phaser.Input.Keyboard.JustDown(k.w);
    if (t.jumpQueued) { pressed = true; t.jumpQueued = false; }
    let dash = Phaser.Input.Keyboard.JustDown(k.shift) || Phaser.Input.Keyboard.JustDown(k.k);
    if (t.dashQueued) { dash = true; t.dashQueued = false; }
    return { left, right, held, pressed, dash };
  }

  update(time, delta) {
    this.updateFences(time);
    this.updateHerd();
    if (this.finished) return;
    const p = this.player;
    if (this.paused || this.respawning) { p.setVelocityX(0); return; }
    this.elapsed += delta;
    const c = this.readControls();
    const onGround = p.body.blocked.down || p.body.touching.down;
    if (onGround) { this.lastGround = time; this.jumpsUsed = 0; this.dashAvail = true; }

    if (c.dash && SAVE.dash && !this.dashing && this.dashAvail && time > this.dashReadyAt) this.startDash(time, c);
    if (this.dashing) {
      p.setVelocity(this.dashDir * DASH_V, 0);
      this.afterimage();
      this.breakAdjacentWall();
      // só termina por bater numa parede depois de ter mesmo arrancado (antes terminava logo encostada ao fardo)
      const blocked = this.dashDir > 0 ? p.body.blocked.right : p.body.blocked.left;
      if (time > this.dashEnd || (blocked && time - this.dashStart > 90)) this.endDash();
    } else if (time > this.hurtLock) {
      let vx = 0;
      if (c.left) vx -= RUN;
      if (c.right) vx += RUN;
      const vx0 = p.body.velocity.x;
      // no ar, depois do arranque, o embalo dura mais (mais fácil atravessar a vala)
      const keep = !onGround && Math.abs(vx0) > RUN && Math.sign(vx0) === Math.sign(vx || vx0);
      p.setVelocityX(Phaser.Math.Linear(vx0, vx || (keep ? vx0 : 0), onGround ? 0.35 : keep ? 0.03 : 0.18));
      if (vx < 0) p.setFlipX(true); else if (vx > 0) p.setFlipX(false);
    }

    if (c.pressed) this.jumpBuffer = time;
    if (time - this.jumpBuffer < 130 && this.dashing && (time - this.lastGround < 110 || (SAVE.doubleJump && this.jumpsUsed < 2))) {
      this.endDash(); // saltar durante o arranque: mantém o embalo
    }
    if (time - this.jumpBuffer < 130 && !this.dashing) {
      if (time - this.lastGround < 110 && this.jumpsUsed === 0) {
        p.setVelocityY(-570); this.jumpAt = time; this.jumpsUsed = 1; this.lastGround = -9999; this.jumpBuffer = -9999; Sfx.play('jump');
      } else if (SAVE.doubleJump && this.jumpsUsed < 2 && !onGround) {
        p.setVelocityY(-530); this.jumpAt = time; this.jumpsUsed = 2; this.jumpBuffer = -9999; Sfx.play('djump'); this.puff(p.x, p.body.bottom);
      }
    }
    if (!c.held && !this.dashing && time - (this.jumpAt || 0) > 150 && p.body.velocity.y < -260 && this.jumpsUsed > 0) p.setVelocityY(-260);

    if (this.dashing || !onGround) { p.anims.stop(); p.setTexture('mimosa_jump'); }
    else if (Math.abs(p.body.velocity.x) > 30) { if (p.anims.currentAnim?.key !== 'walk' || !p.anims.isPlaying) p.play('walk'); }
    else { p.anims.stop(); p.setTexture('mimosa_idle'); }

    for (const e of this.walkers.getChildren()) {
      if (e.dead) continue;
      let speed = e.baseSpeed;
      if (e.kind === 'farmer' && Math.abs(p.x - e.x) < 220 && Math.abs(p.y - e.y) < 80) {
        // agricultor rabugento: acelera na direção da Mimosa, mas sem sair da zona dele
        const want = p.x < e.x ? -1 : 1;
        if ((want < 0 && e.x > e.minX) || (want > 0 && e.x < e.maxX)) { e.dir = want; speed *= 1.9; }
      }
      if (e.x < e.minX) e.dir = 1; else if (e.x > e.maxX) e.dir = -1;
      e.setVelocityX(e.dir * speed);
      e.setFlipX(e.kind === 'can' ? e.dir > 0 : e.dir < 0);
    }
    for (const t of this.tractors.getChildren()) {
      if (t.x < t.minX) t.dir = 1; else if (t.x > t.maxX) t.dir = -1;
      t.setVelocityX(t.dir * t.baseSpeed);
      t.setFlipX(t.dir > 0);
    }
    if (this.boss) this.boss.update(time, delta);

    if (p.y > GT + 320) this.fall();
  }

  updateFences(time) {
    for (const f of this.efences) {
      const ph = (time + f.offset) % 3000;
      const on = ph < 1400;
      const warn = !on && ph > 2550;
      const flick = on ? Math.floor(time / 70) % 2 : 0;
      const key = `${on}${warn}${flick}${warn ? Math.floor(time / 120) % 2 : 0}`;
      f.on = on;
      if (key === f.drawn) continue;
      f.drawn = key;
      const g = f.g; g.clear();
      g.fillStyle(0x6e4527); g.fillRect(f.x - 6, GT - 270, 12, 270);
      g.fillStyle(0x444444); g.fillRect(f.x - 8, GT - 276, 16, 10);
      const col = on ? 0xfff35a : warn && Math.floor(time / 120) % 2 ? 0xff8a00 : 0x777777;
      g.lineStyle(on ? 3 : 2, col, 1);
      for (let y = GT - 250; y < GT; y += 30) {
        if (on) g.lineBetween(f.x - 16, y + (flick ? 3 : -3), f.x + 16, y + (flick ? -3 : 3));
        else g.lineBetween(f.x - 16, y, f.x + 16, y);
      }
      if (on) { g.fillStyle(0xffffff, 0.6); g.fillCircle(f.x, GT - 278, 8); }
    }
  }

  startDash(time, c) {
    const p = this.player;
    this.dashing = true;
    this.dashAvail = false;
    this.dashStart = time;
    this.dashEnd = time + DASH_MS;
    this.dashReadyAt = time + 520;
    this.dashDir = c.left && !c.right ? -1 : c.right && !c.left ? 1 : p.flipX ? -1 : 1;
    p.setFlipX(this.dashDir < 0);
    p.body.allowGravity = false;
    Sfx.play('dash');
    this.breakAdjacentWall(); // parado e encostado ao fardo também parte
  }

  // Parte um fardo encostado (ou a poucos píxeis) na direção do arranque.
  breakAdjacentWall() {
    const b = this.player.body;
    for (const wall of this.hayWalls) {
      if (wall.broken) continue;
      const wb = wall.body;
      const gap = this.dashDir > 0 ? wb.left - b.right : b.left - wb.right;
      const vOverlap = b.bottom > wb.top && b.top < wb.bottom;
      if (vOverlap && gap > -24 && gap < 36) { this.breakWall(wall); return true; }
    }
    return false;
  }

  endDash() {
    const p = this.player;
    this.dashing = false;
    p.body.allowGravity = true;
    p.setVelocityX(this.dashDir * 400);
  }

  afterimage() {
    const p = this.player;
    const g = this.add.image(p.x, p.y, p.texture.key).setFlipX(p.flipX).setDepth(9).setAlpha(0.45).setTint(0xffd27a);
    this.tweens.add({ targets: g, alpha: 0, duration: 220, onComplete: () => g.destroy() });
  }

  breakWall(wall) {
    if (wall.broken) return;
    wall.broken = true;
    wall.body.enable = false;
    Sfx.play('stomp');
    this.cameras.main.shake(160, 0.008);
    for (let i = 0; i < 14; i++) {
      const s = this.add.image(wall.x + Phaser.Math.Between(-30, 30), GT - Phaser.Math.Between(0, 280), 'feno').setScale(0.35).setDepth(9);
      this.tweens.add({ targets: s, x: s.x + Phaser.Math.Between(40, 160) * this.dashDir, y: s.y + Phaser.Math.Between(-60, 120), angle: Phaser.Math.Between(-180, 180), alpha: 0, duration: 700, onComplete: () => s.destroy() });
    }
    wall.img.destroy();
    const pop = txt(this, wall.x, GT - 300, 'CRAAC!', 20, { color: '#FFF3A0' }).setDepth(12);
    this.tweens.add({ targets: pop, y: pop.y - 30, alpha: 0, duration: 700, onComplete: () => pop.destroy() });
  }

  puff(x, y) {
    for (let i = 0; i < 6; i++) {
      const s = this.add.image(x, y, 'faisca').setDepth(9).setScale(0.8);
      this.tweens.add({ targets: s, x: x + Phaser.Math.Between(-30, 30), y: y + Phaser.Math.Between(0, 16), alpha: 0, scale: 0.2, duration: 350, onComplete: () => s.destroy() });
    }
  }

  collect(c) {
    if (!c.active || !c.body.enable) return;
    c.body.enable = false;
    this.clovers++;
    Sfx.play('coin');
    this.tweens.add({ targets: c, y: c.y - 40, alpha: 0, duration: 300, onComplete: () => c.destroy() });
  }

  getPower() {
    if (this.power.got) return;
    this.power.got = true;
    const type = this.world.power.type;
    this.setCheckpoint(this.power.x, GT - 40);
    if (SAVE[type]) { this.hud.toast(type === 'dash' ? 'O arranque já é teu!' : 'O duplo salto já é teu!'); return; }
    SAVE[type] = true;
    persist();
    Sfx.play('power');
    this.cameras.main.flash(200, 255, 243, 160);
    this.tweens.add({ targets: this.power, y: this.power.y - 60, alpha: 0, scale: 2, duration: 500 });
    if (type === 'dash') {
      this.hud.toast(`Ferradura-turbo! ARRANQUE desbloqueado.\n${this.isTouch ? 'Toca na faixa ▶▶ (ou 2 toques em ▶)' : 'Shift ou K'}: dispara em frente e parte fardos. (ficou gravado)`, 4200);
      this.hud.layout();
    } else {
      this.hud.toast('Cogumelo dourado! DUPLO SALTO desbloqueado.\nSalta outra vez no ar. (ficou gravado)', 3800);
    }
  }

  reachCheckpoint(f) {
    if (f.reached) return;
    f.reached = true;
    f.cloth.setTexture('pano_on');
    Sfx.play('check');
    this.setCheckpoint(f.x, GT - 40);
    this.hud.toast('Ponto de controlo!');
  }

  setCheckpoint(x, y) {
    this.checkpoint = { x, y };
    this.fallsInRow = 0;
  }

  touchWalker(e) {
    if (e.dead) return;
    const p = this.player;
    const fromTop = p.body.velocity.y > 0 && p.body.bottom < e.body.top + 16;
    if (fromTop || this.dashing) {
      e.dead = true;
      e.anims.stop();
      e.setTexture(e.kind === 'can' ? 'can_flat' : 'agricultor_flat');
      e.body.enable = false;
      Sfx.play('stomp');
      if (fromTop) { p.setVelocityY(e.kind === 'farmer' ? -620 : -430); this.jumpsUsed = 1; }
      const word = e.kind === 'can' ? 'CLANC!' : Phaser.Utils.Array.GetRandom(['Ai a minha barriga!', 'BOING!', 'Raios!']);
      const pop = txt(this, e.x, e.y - 34, word, 16, { color: '#FFF3A0' }).setDepth(12);
      this.tweens.add({ targets: pop, y: pop.y - 30, alpha: 0, duration: 700, onComplete: () => pop.destroy() });
      this.tweens.add({ targets: e, alpha: 0, delay: 600, duration: 400, onComplete: () => e.destroy() });
    } else {
      this.hurt(e.x);
    }
  }

  hurt(fromX) {
    const now = this.time.now;
    if (now < this.invulnUntil || this.respawning || this.finished) return;
    const p = this.player;
    if (this.dashing) this.endDash();
    this.hearts--;
    Sfx.play('hurt');
    this.invulnUntil = now + (SAVE.easy ? 2000 : 1300);
    this.hurtLock = now + 300;
    const dir = fromX !== undefined ? (p.x < fromX ? -1 : 1) : (p.flipX ? 1 : -1);
    p.setVelocity(dir * 260, -330);
    this.tweens.add({ targets: p, alpha: 0.3, yoyo: true, repeat: 5, duration: 100, onComplete: () => p.setAlpha(1) });
    this.cameras.main.shake(150, 0.006);
    if (this.hearts <= 0) this.respawn(false);
  }

  fall() {
    if (this.respawning) return;
    this.fallsInRow++;
    Sfx.play('fall');
    this.respawn(true);
  }

  respawn(fromFall) {
    this.respawning = true;
    if (this.dashing) this.endDash();
    const cam = this.cameras.main;
    cam.fadeOut(250, 28, 20, 16);
    cam.once('camerafadeoutcomplete', () => {
      const p = this.player;
      p.setPosition(this.checkpoint.x, this.checkpoint.y).setVelocity(0, 0).setAlpha(1);
      this.hearts = 3;
      this.invulnUntil = this.time.now + 1000;
      cam.fadeIn(250, 28, 20, 16);
      this.respawning = false;
      if (fromFall && this.fallsInRow >= 2 && !SAVE.easy) this.offerEasy();
      else if (!fromFall) this.hud.toast('Ai! De volta ao último ponto.');
    });
  }

  offerEasy() {
    this.paused = true;
    this.physics.pause();
    this.hud.modal(
      'Isto está difícil?',
      'Caíste duas vezes seguidas.\nQueres pôr fardos de feno nos buracos e inimigos mais lentos?',
      'Sim, mais fácil', () => { SAVE.easy = true; persist(); this.applyEasy(true); this.resume(); },
      'Não, eu consigo!', () => this.resume(),
    );
  }

  resume() {
    this.fallsInRow = 0;
    this.paused = false;
    this.physics.resume();
  }

  // manada que segue a Mimosa (cosmético)
  addFollower(img) {
    this.herd.push(img);
  }

  updateHerd() {
    const p = this.player;
    if (!p || !this.herd.length) return;
    this.history.push({ x: p.x, y: p.y, f: p.flipX });
    if (this.history.length > 200) this.history.shift();
    this.herd.forEach((c, i) => {
      const h = this.history[Math.max(0, this.history.length - 1 - (i + 1) * 14)];
      if (!h || c.following === false) return;
      const back = (i + 1) * 36 * (h.f ? 1 : -1); // ficam em fila atrás da Mimosa
      c.x = Phaser.Math.Linear(c.x, h.x + back, 0.2);
      c.y = Phaser.Math.Linear(c.y, h.y, 0.25);
      c.setFlipX(h.f);
    });
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    const p = this.player;
    p.setVelocity(0, 0);
    p.body.enable = false;
    p.anims.stop(); p.setTexture('mimosa_jump');
    Sfx.play('win');
    if (this.world.goal.type === 'gate') {
      const gx = this.gateX;
      this.tweens.add({ targets: this.gate, scaleX: 0.15, duration: 400 });
      this.time.delayedCall(450, () => {
        this.mana.setTexture('mana_happy').setDepth(6);
        this.tweens.add({ targets: this.mana, x: gx + 34, duration: 500, ease: 'Sine.out' });
        this.tweens.add({ targets: [this.mana, p], y: '-=24', yoyo: true, repeat: 3, duration: 200, delay: 500 });
        const muu = txt(this, gx - 60, GT - 150, 'MUUU!', 30, { color: '#FFF3A0', stroke: '#C4452D' }).setDepth(12);
        this.tweens.add({ targets: muu, scale: 1.3, yoyo: true, repeat: 2, duration: 250 });
      });
    }
    const time = Math.round(this.elapsed);
    const ws = SAVE[`world${this.world.id}`];
    const record = !ws.done || ws.bestTime === null || time < ws.bestTime;
    ws.done = true;
    ws.bestClovers = Math.max(ws.bestClovers, this.clovers);
    if (record) ws.bestTime = time;
    persist();
    this.time.delayedCall(this.world.goal.type === 'gate' ? 2300 : 600, () => {
      this.cameras.main.fadeOut(300, 28, 20, 16);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Complete', { world: this.world.id, clovers: this.clovers, total: this.totalClovers, time, record }));
    });
  }

  // usado pelos testes automáticos
  debugWarp(x, y = GT - 60) {
    if (this.dashing) this.endDash();
    this.player.setPosition(x, y).setVelocity(0, 0);
  }
}
