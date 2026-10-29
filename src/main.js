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

// Telemóvel: os toques repetidos (2 toques em ▶) nunca podem virar zoom do browser. Se o browser ficar com zoom
// (duplo toque, rotação no iOS), o jogo deixava de caber no ecrã (botões cortados): repõe a escala 1 e reajusta.
const vpMeta = document.querySelector('meta[name=viewport]');
const BASE_VP = vpMeta ? vpMeta.content : '';
const fitViewport = () => {
  const vv = window.visualViewport;
  if (vpMeta && vv && vv.scale > 1.01) {
    vpMeta.content = BASE_VP + ', minimum-scale=1';
    setTimeout(() => { vpMeta.content = BASE_VP; game.scale.refresh(); }, 60);
  } else game.scale.refresh();
};
window.visualViewport?.addEventListener('resize', fitViewport);
window.addEventListener('orientationchange', () => setTimeout(fitViewport, 350));
for (const ev of ['dblclick', 'gesturestart', 'gesturechange']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch(() => {}));
}
