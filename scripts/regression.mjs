// Teste de regressão "como um jogador": toques DOM reais (multi-dedo) e teclas reais.
// Joga o Mundo 1 até ao fim sem teletransporte (modo fácil ligado no menu, como um jogador pode fazer),
// toca "Próximo: A Quinta", e verifica que a Mimosa anda e salta no Mundo 2. Também: repetir o Mundo 1,
// entrar pelo menu/seleção de mundos, e o fardo + vala do arranque (a partir de parado, encostada ao fardo).
import { chromium } from 'playwright-core';
import { makeTouch } from './touch-helpers.mjs';
const BASE = process.env.BASE || 'http://127.0.0.1:4173/mootiny';
const OUT = process.env.OUT || 'screens';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
let failures = 0;

async function session(name, opts, body) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  const { width: w, height: h } = opts.viewport;
  const log = (...a) => console.log(`[${name}]`, ...a);
  const check = (ok, msg) => { if (!ok) { failures++; log('FAIL: ' + msg); } else log('ok: ' + msg); };
  const L = (e) => page.evaluate(`(() => { const L = window.__MOOTINY__.scene.getScene('Level'); return ${e}; })()`); // só leitura
  const scenes = () => page.evaluate(() => window.__MOOTINY__.scene.getScenes(true).map((s) => s.sys.settings.key));
  const touch = opts.hasTouch ? makeTouch(page) : null;
  const tap = (x, y) => (touch ? touch.tap(x, y) : page.mouse.click(x, y));
  const input = touch ? {
    right: (on) => (on ? touch.down(1, w * 0.37, h * 0.75) : touch.up(1)),
    left: (on) => (on ? touch.down(2, w * 0.12, h * 0.75) : touch.up(2)),
    jump: () => touch.tap(w * 0.86, h * 0.6, 3, 60),
    dash: () => touch.tap(w * 0.59, h * 0.6, 4, 60),
  } : {
    right: (on) => (on ? page.keyboard.down('d') : page.keyboard.up('d')),
    left: (on) => (on ? page.keyboard.down('a') : page.keyboard.up('a')),
    jump: async () => { await page.keyboard.down('Space'); await sleep(60); await page.keyboard.up('Space'); },
    dash: async () => { await page.keyboard.down('Shift'); await sleep(60); await page.keyboard.up('Shift'); },
  };
  const ctx2 = { page, w, h, log, check, L, scenes, tap, input, touch };
  // botões lidos das próprias cenas (posição real no ecrã), p.ex. tapObj('Title', 'btns.play')
  ctx2.at = (scene, p) => page.evaluate(([s, path]) => {
    const o = path.split('.').reduce((a, k) => a[k], window.__MOOTINY__.scene.getScene(s));
    const m = o.getWorldTransformMatrix(); return { x: m.tx, y: m.ty };
  }, [scene, p]);
  ctx2.tapObj = async (scene, p) => { const q = await ctx2.at(scene, p); await tap(q.x, q.y); };
  ctx2.gotoTitle = async () => { await page.goto(BASE + '/'); await page.waitForFunction(() => window.__MOOTINY__?.scene?.isActive('Title'), null, { timeout: 30000 }); await sleep(800); };
  ctx2.waitScene = async (key, ms = 8000) => { const t = Date.now(); while (Date.now() - t < ms) { if ((await scenes()).includes(key)) return true; await sleep(150); } return false; };
  ctx2.throughIntro = async () => {
    for (let i = 0; i < 20 && (await scenes()).includes('Intro'); i++) { if (touch) await tap(w / 2, h * 0.6); else await page.keyboard.press('Enter'); await sleep(450); }
    return ctx2.waitScene('Level');
  };
  // anda e salta com o input real e confirma pelo estado do jogo (só leitura)
  ctx2.walkJump = async (tag) => {
    await sleep(500);
    const x0 = await L('L.player.x'), y0 = await L('L.player.y');
    await input.right(true); await sleep(700);
    await input.jump();
    let minY = 1e9; for (let i = 0; i < 8; i++) { minY = Math.min(minY, await L('L.player.y')); await sleep(40); }
    await input.right(false); await sleep(200);
    const x1 = await L('L.player.x');
    check(x1 > x0 + 100 && y0 - minY > 50, `${tag}: Mimosa anda (${Math.round(x1 - x0)}px) e salta (${Math.round(y0 - minY)}px)`);
  };
  // "bot" simples: segura ▶ e salta perante obstáculos (lê posições; não mexe no estado)
  ctx2.playToEnd = async (maxMs) => {
    await input.right(true);
    const t0 = Date.now(); let lastX = 0, still = 0, airJumped = false;
    while (Date.now() - t0 < maxMs) {
      if (!(await scenes()).includes('Level')) break;
      const s = await L(`!L.player || !L.player.body ? null : ({x:L.player.x, y:L.player.y, vy:L.player.body.velocity.y, g:L.player.body.blocked.down || L.player.body.touching.down,
        fin:L.finished, modal:L.hud.modalOpen, en:L.walkers.getChildren().filter(e=>!e.dead).map(e=>e.x),
        tr:L.tractors.getChildren().map(t=>t.x), th:L.thistles.getChildren().map(t=>t.x), gr:L.world.grounds, pits:L.hayPlaced ? [] : L.world.pits})`);
      if (!s || s.fin) { await sleep(200); continue; }
      if (s.modal) { await input.right(false); await ctx2.tapObj('Hud', 'modalBtns.yes'); await sleep(300); await input.right(true); continue; }
      const ahead = (arr, d) => arr.some((x) => x > s.x + 8 && x < s.x + d);
      const wall = s.gr.some(([a, , top]) => a > s.x && a - s.x < 90 && top < s.y - 10);
      const pit = s.pits.some(([a]) => a > s.x && a - s.x < 50);
      if (s.g) {
        airJumped = false;
        if (wall || pit || ahead(s.en, 110) || ahead(s.th, 80) || ahead(s.tr, 150)) await input.jump();
      } else if (!airJumped && s.vy > -120 && (wall || s.pits.some(([a, b]) => s.x > a - 20 && s.x < b))) { await input.jump(); airJumped = true; }
      if (Math.abs(s.x - lastX) < 1.5) { if (++still > 25) { await input.jump(); still = 0; } } else still = 0;
      lastX = s.x;
      if (process.env.DEBUG && Date.now() % 2000 < 40) log('bot', Math.round(s.x), Math.round(s.y), s.g, await L('[L.hearts, JSON.stringify(L.hud.touch), L.paused, L.respawning].join(" ")'));
      await sleep(30);
    }
    await input.right(false);
  };
  try { await body(ctx2); } catch (e) { failures++; log('FAIL: exception ' + e.message); }
  log('console errors:', errors.length ? errors : 'none');
  if (errors.length) failures++;
  await ctx.close();
}

// ---------- 1) Jogador real: Mundo 1 completo → Próximo → Mundo 2; repetir; entrar pelo menu ----------
async function fullFlow(c, kind) {
  const { page, w, h, check, tap, scenes, L } = c;
  await c.gotoTitle();
  await c.tapObj('Title', 'btns.easy'); await sleep(300); // "Modo fácil" no menu
  await c.tapObj('Title', 'btns.play'); // Jogar
  check(await c.waitScene('Intro'), 'Jogar abre a intro');
  check(await c.throughIntro(), 'intro do Mundo 1 termina com toques/teclas');
  await c.walkJump('Mundo 1');
  await c.playToEnd(300000); // o Chrome sem GPU corre a ~25–30 fps a 1280x800: o tempo de jogo anda mais devagar
  check(await c.waitScene('Complete', 9000), 'Mundo 1 jogado até ao fim (sem teletransporte)');
  await page.screenshot({ path: `${OUT}/regressao-${kind}-1-mundo1-fim.png` });
  await c.tapObj('Complete', 'btns.next'); // Próximo: A Quinta
  check(await c.waitScene('Intro'), 'Próximo abre a intro da Quinta');
  check(await c.throughIntro(), 'intro da Quinta termina');
  check((await L('L.world.id')) === 2, 'Mundo 2 a correr');
  await c.walkJump('Mundo 2 depois de Próximo');
  await page.screenshot({ path: `${OUT}/regressao-${kind}-2-mundo2.png` });
  // Menu → Mundo 1 (repetir)
  await c.tapObj('Hud', 'menuBtn'); check(await c.waitScene('Title'), 'Menu do HUD volta ao título');
  await sleep(500);
  // a intro do Mundo 1 só aparece na 1.ª vez: agora a seleção entra direto no nível
  await c.tapObj('Title', 'btns.world1'); check(await c.waitScene('Level'), 'seleção: Mundo 1 (intro já vista → direto ao nível)');
  check(!(await scenes()).includes('Intro'), 'intro do Mundo 1 não se repete');
  await c.walkJump('Mundo 1 repetido');
  await c.tapObj('Hud', 'menuBtn'); await c.waitScene('Title'); await sleep(500);
  await c.tapObj('Title', 'btns.world2'); check(await c.waitScene('Intro'), 'seleção: Mundo 2');
  await sleep(400);
  await c.tapObj('Intro', 'btns.skip'); check(await c.waitScene('Level'), 'Saltar ▸ entra no nível');
  check((await L('L.world.id')) === 2, 'Mundo 2 pela seleção');
  await c.walkJump('Mundo 2 pela seleção');
}

// ---------- 2) Fardo a partir de parado + vala, sem modo fácil (paisagem, como o Pedro) ----------
async function dashWall(c, kind, hold = false) {
  const { page, w, h, check, L, input, log } = c;
  await c.gotoTitle();
  // entrada direta no Mundo 2 e posição antes da ferradura (os comandos são todos reais)
  await page.evaluate(() => window.__MOOTINY__.scene.getScene('Title').scene.start('Level', { world: 2 }));
  await sleep(1200);
  await L('L.debugWarp(2470)'); await sleep(400);
  await input.right(true);
  let gotDash = false;
  for (let i = 0; i < 30 && !gotDash; i++) { await sleep(100); gotDash = await page.evaluate(() => (JSON.parse(localStorage.getItem('mootiny.save.v1') || '{}').dash === true)); }
  await input.right(false); await sleep(300);
  check(gotDash, 'ferradura apanhada: arranque gravado');
  await sleep(1500);
  // anda até encostar ao fardo e fica parada
  await input.right(true); await sleep(1600); if (!hold) { await input.right(false); await sleep(600); }
  const xs = await L('L.player.x');
  check(xs > 2700 && xs < 2775 && !(await L('L.hayWalls[0].broken')), `encostada ao fardo e parada (x=${Math.round(xs)})`);
  await page.screenshot({ path: `${OUT}/regressao-${kind}-3-fardo.png` });
  await input.dash(); await sleep(500); if (hold) await input.right(false);
  check(await L('L.hayWalls[0].broken === true'), hold ? 'encostada a segurar ▶ + arranque parte o fardo' : 'arranque a partir de parado parte o fardo');
  // vala: correr, saltar, duplo salto, arranque
  await L('L.debugWarp(2780)'); await sleep(500);
  await input.right(true);
  const t0 = Date.now(); let stage = 0;
  while (Date.now() - t0 < 4000) {
    const s = await L('({x:L.player.x, vy:L.player.body.velocity.y, g:L.player.body.blocked.down})');
    if (stage === 0 && s.x > 2870) { await input.jump(); stage = 1; }
    else if (stage === 1 && !s.g && s.vy > -150) { await input.jump(); stage = 2; }
    else if (stage === 2 && s.vy > 50) { await input.dash(); stage = 3; }
    else if (stage === 3 && s.g) break;
    await sleep(25);
  }
  await sleep(300); await input.right(false);
  const end = await L('({x:L.player.x, y:L.player.y, falls:L.fallsInRow})');
  log('vala: x', Math.round(end.x), 'quedas', end.falls);
  check(end.x > 3240 && end.falls === 0, 'vala de 340px atravessada com salto + duplo salto + arranque');
  await page.screenshot({ path: `${OUT}/regressao-${kind}-4-vala.png` });
}

const mobile = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const landscape = { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const desktop = { viewport: { width: 1280, height: 800 } };
if (!process.env.ONLY_DASH && !process.env.ONLY_KEY) await session('toque-390x844', mobile, (c) => fullFlow(c, 'toque'));
if (process.env.ONLY_TOUCH) { await browser.close(); process.exit(failures ? 1 : 0); }
if (!process.env.ONLY_DASH) await session('teclado-1280x800', desktop, (c) => fullFlow(c, 'teclado'));
if (process.env.ONLY_KEY) { await browser.close(); process.exit(failures ? 1 : 0); }
await session('toque-paisagem-844x390', landscape, (c) => dashWall(c, 'paisagem'));
await session('teclado-fardo', desktop, (c) => dashWall(c, 'teclado'));
await session('toque-paisagem-segura', landscape, (c) => dashWall(c, 'paisagem-segura', true));
await session('teclado-fardo-segura', desktop, (c) => dashWall(c, 'teclado-segura', true));
await browser.close();
console.log(failures ? `REGRESSION FAILURES: ${failures}` : 'REGRESSION PASSED');
process.exit(failures ? 1 : 0);
