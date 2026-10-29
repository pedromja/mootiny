import Phaser from 'phaser';
import { Sfx } from './sfx.js';
import { txt, popText, sparkles } from './common.js';
import { Music } from './sfx.js';
import { GT } from './worlds.js';

// Super Ordenhadeira 3000: lança gotas de leite (desvia), avisa, carrega contra a parede,
// fica atordoada com o botão vermelho à mostra: salta-lhe em cima 3 vezes.
export class Boss {
  constructor(scene, ar0, ar1) {
    this.s = scene;
    this.ar0 = ar0;
    this.ar1 = ar1;
    this.minX = ar0 + 100;
    this.maxX = ar1 - 100;
    this.maxHp = 3;
    this.hp = 3;
    this.state = 'wait';
    this.mul = 1;
    this.easy = false;
    this.firstStun = true;

    // jaulas penduradas com as manas
    this.cages = [];
    const skins = ['mana2', 'mana3', 'mana4'];
    [ar0 + 230, ar0 + 390, ar0 + 550].forEach((x, i) => {
      const chain = scene.add.rectangle(x, GT - 410, 4, 128, 0x7d8aa0).setOrigin(0.5, 0).setDepth(0).setStrokeStyle(1.5, 0x1c1410);
      const cow = scene.add.image(x, GT - 214, skins[i], 0).setDepth(0).setScale(0.45);
      const cage = scene.add.image(x, GT - 250, 'jaula').setOrigin(0.5, 0.15).setScale(0.5).setDepth(0.5);
      this.cages.push({ x, chain, cow, cage, skin: skins[i] });
    });

    // 320x210 (2x) a meia escala = 160x105; caixa em píxeis da textura (o dobro da antiga 140x80 +10,+20)
    this.sprite = scene.physics.add.sprite(ar1 - 140, GT - 52, 'ordenhadeira', 0).setScale(0.5).setDepth(7);
    this.sprite.body.allowGravity = false;
    this.sprite.setImmovable(true);
    this.sprite.body.setSize(280, 160).setOffset(20, 40);
    this.blobs = scene.physics.add.group();
    // Atenção: a ordem dos argumentos pode vir trocada; nunca destruir o chão por engano.
    scene.physics.add.collider(this.blobs, scene.solids, (a, b) => this.splash(this.isBlob(a) ? a : b));
    this.wall = null;
  }

  // ligado depois do jogador existir
  bind() {
    const s = this.s;
    s.physics.add.overlap(s.player, this.sprite, () => this.touch());
    s.physics.add.overlap(s.player, this.blobs, (a, b) => { const blob = this.isBlob(a) ? a : b; if (blob.active) { this.splash(blob); s.hurt(blob.x); } });
    this.bound = true;
  }

  start(time) {
    const s = this.s;
    this.state = 'intro';
    this.t = time + 1600;
    // fecha a porta atrás da Mimosa e prende a câmara ao estábulo
    this.wall = s.addSolid(this.ar0 - 20, GT - 600, 20, 600);
    s.physics.add.collider(s.player, this.wall);
    const door = s.add.rectangle(this.ar0 - 10, GT, 20, 260, 0x4a3020).setOrigin(0.5, 1).setDepth(8).setScale(1, 0);
    s.tweens.add({ targets: door, scaleY: 1, duration: 400 });
    s.cameras.main.setBounds(this.ar0 - 20, -700, this.ar1 - this.ar0 + 20, 780 + 700);
    s.setCheckpoint(this.ar0 + 90, GT - 40);
    Sfx.play('boss_hit');
    Music.play('boss');
    s.cameras.main.shake(300, 0.006);
    s.hud.setBoss(this.hp, this.maxHp);
    s.hud.toast('SUPER ORDENHADEIRA 3000!\nDesvia-te do leite. Quando bater na parede, salta-lhe no botão vermelho!', 4200);
  }

  enter(state, time) {
    this.state = state;
    const sp = this.sprite;
    if (state === 'lob') { this.t = time + (this.easy ? 3200 : 2600 / this.mul); this.nextLob = time + 500; sp.setFrame(0); sp.clearTint(); }
    if (state === 'tele') { this.t = time + (this.easy ? 1100 : 850); sp.setVelocityX(0); this.chargeDir = this.s.player.x < sp.x ? -1 : 1; sp.setFlipX(this.chargeDir > 0); Sfx.play('beam', { volume: 0.5, rate: 1.4 }); }
    if (state === 'charge') { this.t = time + 4000; }
    if (state === 'stun') {
      this.t = time + (this.easy ? 3600 : 2800);
      sp.setVelocityX(0); sp.setFrame(1); sp.clearTint();
      sparkles(this.s, sp.x, sp.y - 50, { n: 8, spread: 50, tint: 0xffd43b, scale: 0.5 });
      this.s.cameras.main.shake(220, 0.012); Sfx.play('stomp');
      if (this.firstStun) { this.firstStun = false; this.s.hud.toast('Está tonta! Salta no BOTÃO VERMELHO!', 2200); }
    }
    if (state === 'hit') { this.t = time + 700; sp.setVelocityX(0); }
  }

  update(time) {
    const s = this.s;
    const sp = this.sprite;
    const p = s.player;
    if (!this.bound) this.bind();
    if (this.state === 'wait') { if (p.x > this.ar0 + 80) this.start(time); return; }
    if (this.state === 'dead') return;
    switch (this.state) {
      case 'intro':
        if (time > this.t) this.enter('lob', time);
        break;
      case 'lob': {
        const dx = p.x - sp.x;
        sp.setVelocityX(Math.abs(dx) > 220 ? Math.sign(dx) * 55 * this.mul : 0);
        sp.setFlipX(dx > 0);
        if (time > this.nextLob) { this.lob(); this.nextLob = time + (this.easy ? 1300 : 900 / this.mul); }
        if (time > this.t) this.enter('tele', time);
        break;
      }
      case 'tele':
        sp.setTint(Math.floor(time / 100) % 2 ? 0xff6b6b : 0xffffff);
        sp.x += Math.sin(time / 20) * 1.5;
        if (time > this.t) { sp.clearTint(); this.enter('charge', time); }
        break;
      case 'charge':
        sp.setVelocityX(this.chargeDir * (this.easy ? 260 : 380 * this.mul));
        if ((this.chargeDir < 0 && sp.x <= this.minX) || (this.chargeDir > 0 && sp.x >= this.maxX) || time > this.t) {
          sp.x = Phaser.Math.Clamp(sp.x, this.minX, this.maxX);
          this.enter('stun', time);
        }
        break;
      case 'stun':
        sp.setScale(0.5, 0.5 * (1 + Math.sin(time / 90) * 0.02));
        if (time > this.t) { sp.setScale(0.5); this.enter('lob', time); }
        break;
      case 'hit':
        sp.setTint(Math.floor(time / 80) % 2 ? 0xffffff : 0xff4444);
        if (time > this.t) { sp.clearTint(); this.enter('lob', time); }
        break;
    }
    sp.x = Phaser.Math.Clamp(sp.x, this.minX, this.maxX);
    for (const b of this.blobs.getChildren()) if (b.y > GT + 200) b.destroy();
  }

  lob() {
    const s = this.s;
    const sp = this.sprite;
    const p = s.player;
    const T = 1.05;
    const bx = sp.x + (sp.flipX ? 30 : -30), by = sp.y - 50;
    const tx = p.x + Phaser.Math.Between(-30, 30), ty = GT - 10;
    const b = this.blobs.create(bx, by, 'gota').setScale(0.5).setDepth(8);
    b.body.setSize(24, 28);
    b.setVelocity((tx - bx) / T, (ty - by - 0.5 * 1400 * T * T) / T);
    Sfx.play('plop', { volume: 0.5 });
  }

  isBlob(o) { return !!o && o.texture && o.texture.key === 'gota'; }

  splash(b) {
    if (!this.isBlob(b) || !b.active) return;
    for (let i = 0; i < 5; i++) {
      const d = this.s.add.image(b.x, b.y, 'gota').setDepth(8).setScale(0.22);
      this.s.tweens.add({ targets: d, x: d.x + Phaser.Math.Between(-24, 24), y: d.y - Phaser.Math.Between(4, 24), alpha: 0, duration: 300, onComplete: () => d.destroy() });
    }
    b.destroy();
  }

  touch() {
    const s = this.s;
    const p = s.player;
    const sp = this.sprite;
    if (this.state === 'dead' || this.state === 'wait' || this.state === 'hit') return;
    const fromTop = p.body.velocity.y > 0 && p.body.bottom < sp.body.top + 20;
    if (fromTop) {
      p.setVelocityY(-620);
      s.jumpsUsed = 1;
      if (this.state === 'stun' && Math.abs(p.x - sp.x) < 60) return this.hit();
      popText(s, sp.x, sp.y - 80, 'Tampa fechada!', { size: 16, color: '#FFE0B2', ms: 600 });
      p.setVelocityX(p.x < sp.x ? -260 : 260);
      return;
    }
    if (this.state !== 'stun') s.hurt(sp.x);
  }

  hit() {
    const s = this.s;
    this.hp--;
    Sfx.play('boss_hit');
    s.cameras.main.shake(200, 0.01);
    s.hud.setBoss(this.hp, this.maxHp);
    popText(s, this.sprite.x, this.sprite.y - 90, this.hp > 0 ? 'BOING!' : 'KAPUT!', { size: 34, rise: 44, ms: 800 });
    sparkles(s, this.sprite.x, this.sprite.y - 50, { n: 12, spread: 70, tint: 0xffd43b, scale: 0.7 });
    if (this.hp <= 0) return this.defeat();
    this.mul += 0.25;
    this.enter('hit', s.time.now);
  }

  defeat() {
    const s = this.s;
    const sp = this.sprite;
    this.state = 'dead';
    sp.setVelocity(0, 0).setFrame(2);
    sp.body.enable = false;
    this.blobs.clear(true, true);
    Sfx.play('boom');
    Music.stop();
    s.time.delayedCall(400, () => Sfx.play('boss_defeat'));
    s.cameras.main.flash(300, 255, 255, 255);
    s.tweens.add({ targets: sp, angle: -10, y: sp.y + 10, duration: 500 });
    for (let i = 0; i < 18; i++) {
      const d = s.add.image(sp.x + Phaser.Math.Between(-60, 60), sp.y + Phaser.Math.Between(-40, 30), 'faisca').setDepth(9).setScale(0.5).setTint(i % 2 ? 0x9ff4ff : 0xffd43b).setBlendMode(Phaser.BlendModes.ADD);
      s.tweens.add({ targets: d, y: d.y - Phaser.Math.Between(60, 160), scale: 1.6, alpha: 0, duration: 1200, delay: i * 40, onComplete: () => d.destroy() });
    }
    s.hud.setBoss(0, this.maxHp, true);
    s.hud.toast('As manas estão livres! A manada segue-te.', 3000);
    // jaulas caem e abrem; as manas juntam-se à manada
    this.cages.forEach((c, i) => {
      s.tweens.add({ targets: c.chain, alpha: 0, duration: 300, delay: 300 + i * 200 });
      s.tweens.add({ targets: c.cage, alpha: 0, y: c.cage.y - 40, duration: 500, delay: 300 + i * 200 });
      s.time.delayedCall(400 + i * 200, () => {
        c.cow.setFrame(1).setScale(0.5).setDepth(9);
        sparkles(s, c.x, c.cow.y, { n: 8, spread: 40, tint: 0xffd43b, scale: 0.5 });
        s.tweens.add({
          targets: c.cow, y: GT - 32, duration: 500, ease: 'Bounce.out',
          onComplete: () => { Sfx.play('moo'); s.addFollower(c.cow); },
        });
      });
    });
    s.time.delayedCall(4200, () => s.finish());
  }
}
