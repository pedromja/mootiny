import Phaser from 'phaser';
import { BootScene, TitleScene, IntroScene, CompleteScene } from './screens.js';
import { LevelScene } from './level.js';
import { HudScene } from './hud.js';
import { Sfx } from './sfx.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#1C1410',
  scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
  physics: { default: 'arcade', arcade: { gravity: { y: 1400 }, debug: false } },
  input: { activePointers: 4 },
  render: { antialias: true, roundPixels: false },
  banner: false,
  scene: [BootScene, TitleScene, IntroScene, LevelScene, HudScene, CompleteScene],
});
window.__MOOTINY__ = game; // usado pelos testes automáticos
Sfx.init(game);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch(() => {}));
}
