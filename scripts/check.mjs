// Verificação automática: carrega o jogo em Chrome headless a 390x844 (toque) e 1280x800 (teclado),
// percorre título → intro → nível → oferta de dificuldade → duplo salto → fim, e guarda capturas.
import { chromium } from 'playwright-core';
const BASE = process.env.BASE || 'http://127.0.0.1:4173/mootiny';
const OUT = 'screens';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
let failures = 0;

async function run(name, opts) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => errors.push('requestfailed: ' + r.url()));
  const { width: w, height: h } = opts.viewport;
  const mobile = !!opts.hasTouch;
  const scenes = () => page.evaluate(() => window.__MOOTINY__.scene.getScenes(true).map((s) => s.sys.settings.key));
  const level = (expr) => page.evaluate(`(() => { const L = window.__MOOTINY__.scene.getScene('Level'); return ${expr}; })()`);
  const tap = async (x, y) => (mobile ? page.touchscreen.tap(x, y) : page.mouse.click(x, y));
  let cdp = mobile ? await ctx.newCDPSession(page) : null;
  const holdTouch = async (x, y, ms) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
    await sleep(ms);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  const log = (...a) => console.log(`[${name}]`, ...a);

  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await sleep(1500);
  log('scenes', await scenes());
  await page.screenshot({ path: `${OUT}/${name}-1-titulo.png` });

  await tap(w / 2, h * 0.29); // botão Jogar
  await sleep(3900);
  log('scenes after play', await scenes());
  await page.screenshot({ path: `${OUT}/${name}-2-intro-plop.png` });
  await page.keyboard.press('Escape');
  await sleep(1200);
  log('scenes after intro', await scenes());

  const x0 = await level('L.player.x');
  if (mobile) {
    await holdTouch(w * 0.37, h * 0.75, 700); // zona "direita"
    await tap(w * 0.8, h * 0.6); // zona "saltar"
    await sleep(150);
  } else {
    await page.keyboard.down('d'); await sleep(700);
    await page.keyboard.press('Space'); await sleep(150);
  }
  const x1 = await level('L.player.x');
  log(`walk: x ${x0.toFixed(0)} -> ${x1.toFixed(0)}, airborne=${await level('!L.player.body.blocked.down')}`);
  if (!(x1 > x0 + 100)) { failures++; log('FAIL: player did not move'); }
  await page.screenshot({ path: `${OUT}/${name}-3-jogo.png` });
  if (!mobile) await page.keyboard.up('d');

  // duas quedas seguidas → oferta de modo fácil
  for (let i = 0; i < 2; i++) { await level('L.debugWarp(955)'); await sleep(1500); }
  const modal = await page.evaluate(() => window.__MOOTINY__.scene.getScene('Hud').modalOpen);
  log('difficulty offer shown:', modal);
  if (!modal) { failures++; log('FAIL: no difficulty offer'); }
  await page.screenshot({ path: `${OUT}/${name}-4-oferta-dificuldade.png` });
  const pw = Math.min(w - 32, 460), bw = Math.min(200, (pw - 48) / 2);
  if (mobile) await tap(w / 2 - bw / 2 - 8, h / 2 + 135 - 50); // Sim
  else await tap(w / 2 + bw / 2 + 8, h / 2 + 135 - 50); // Não
  await sleep(500);
  log('after choice: modalOpen', await page.evaluate(() => window.__MOOTINY__.scene.getScene('Hud').modalOpen), 'easy', await page.evaluate(() => JSON.parse(localStorage.getItem('mootiny.save.v1') || '{}').easy));

  // cogumelo dourado → duplo salto gravado
  await level('L.debugWarp(1790)');
  if (mobile) await holdTouch(w * 0.37, h * 0.75, 600); else { await page.keyboard.down('d'); await sleep(600); await page.keyboard.up('d'); }
  await sleep(300);
  const dj = await page.evaluate(() => JSON.parse(localStorage.getItem('mootiny.save.v1') || '{}').doubleJump);
  log('doubleJump saved:', dj);
  if (!dj) { failures++; log('FAIL: double jump not saved'); }
  await page.screenshot({ path: `${OUT}/${name}-5-duplo-salto.png` });

  // fim do nível
  await level('L.debugWarp(4840)');
  if (mobile) await holdTouch(w * 0.37, h * 0.75, 1500); else { await page.keyboard.down('d'); await sleep(1500); await page.keyboard.up('d'); }
  await sleep(1200);
  await page.screenshot({ path: `${OUT}/${name}-6-mana-livre.png` });
  await sleep(2200);
  const sc = await scenes();
  log('final scenes', sc);
  if (!sc.includes('Complete')) { failures++; log('FAIL: level not completed'); }
  await page.screenshot({ path: `${OUT}/${name}-7-nivel-concluido.png` });

  const save = () => page.evaluate(() => JSON.parse(localStorage.getItem('mootiny.save.v1') || '{}'));
  const press = async (key, ms = 0) => { await page.keyboard.down(key); await sleep(ms || 60); await page.keyboard.up(key); };
  const walkRight = async (ms) => (mobile ? holdTouch(w * 0.37, h * 0.75, ms) : press('d', ms));
  const check = (ok, msg) => { if (!ok) { failures++; log('FAIL: ' + msg); } else log('ok: ' + msg); };

  // ===== Mundo 2 · A Quinta =====
  await tap(w / 2, h * 0.24 + 190); // "Próximo: A Quinta"
  await sleep(1600);
  check((await scenes()).includes('Intro'), 'next button opens World 2 intro');
  await page.screenshot({ path: `${OUT}/${name}-w2-1-intro.png` });
  await page.keyboard.press('Escape');
  await sleep(1200);
  check((await level('L.world.id')) === 2, 'World 2 level running');
  const a0 = await level('L.player.x');
  if (mobile) { await holdTouch(w * 0.37, h * 0.75, 900); await tap(w * 0.8, h * 0.6); }
  else { await page.keyboard.down('d'); await sleep(900); await page.keyboard.press('Space'); }
  await sleep(150);
  await page.screenshot({ path: `${OUT}/${name}-w2-2-jogo.png` });
  if (!mobile) await page.keyboard.up('d');
  check((await level('L.player.x')) > a0 + 120, 'Mimosa moves in World 2');

  // trator e cerca elétrica
  await level('L.debugWarp(1460)'); await sleep(1600);
  await page.screenshot({ path: `${OUT}/${name}-w2-3-trator.png` });
  const fenceStates = new Set();
  for (let i = 0; i < 8; i++) { fenceStates.add(await level('L.efences[0].on')); await sleep(400); }
  check(fenceStates.size === 2, 'electric fence switches on and off');

  // oferta de dificuldade (só se ainda não estiver em modo fácil)
  if (!(await save()).easy) {
    for (let i = 0; i < 2; i++) { await level('L.debugWarp(1210)'); await sleep(1500); }
    check(await page.evaluate(() => window.__MOOTINY__.scene.getScene('Hud').modalOpen), 'easy-mode offer after 2 falls in World 2');
    const pw = Math.min(w - 32, 460), bw = Math.min(200, (pw - 48) / 2);
    await tap(w / 2 + bw / 2 + 8, h / 2 + 135 - 50); // Não
    await sleep(400);
  } else {
    check(await level('L.hayPlaced === true'), 'easy mode carried into World 2 (hay in pits)');
  }

  // arranque: desbloquear, gravar, e o fardo só parte com arranque
  await level('L.debugWarp(2470)');
  await walkRight(500); await sleep(300);
  check((await save()).dash === true, 'dash unlocked mid-level and saved');
  await page.screenshot({ path: `${OUT}/${name}-w2-4-arranque.png` });
  await level('L.debugWarp(2690)');
  await walkRight(900); await sleep(200);
  check((await level('L.player.x')) < 2770 && !(await level('L.hayWalls[0].broken')), 'hay wall blocks without dash');
  await level('L.debugWarp(2700)'); await sleep(400);
  await walkRight(150);
  if (mobile) await tap(w * 0.59, h * 0.6); else await press('Shift');
  await sleep(500);
  check(await level('L.hayWalls[0].broken === true'), 'dash breaks the hay wall');

  // chefe: Super Ordenhadeira 3000
  await level('L.debugWarp(L.world.goal.ar0 + 160)');
  await sleep(2600);
  check((await level('L.boss.state')) !== 'wait', 'boss fight starts');
  await page.screenshot({ path: `${OUT}/${name}-w2-5-chefe.png` });
  let shotStun = false;
  const t0 = Date.now();
  while (Date.now() - t0 < 60000) {
    const st = await level('L.boss.state');
    if (st === 'dead') break;
    if (st === 'stun') {
      if (!shotStun) { await page.screenshot({ path: `${OUT}/${name}-w2-6-chefe-atordoado.png` }); shotStun = true; }
      await level('(L.debugWarp(L.boss.sprite.x, 480 - 220), L.player.setVelocity(0, 100), 1)');
      await sleep(900);
    } else await sleep(150);
  }
  check((await level('L.boss.state')) === 'dead', 'boss beaten with 3 hits on the button');
  await sleep(1800);
  await page.screenshot({ path: `${OUT}/${name}-w2-7-manada.png` });
  check((await level('L.herd.length')) === 3, 'three sisters freed and following');
  await sleep(4500);
  check((await scenes()).includes('Complete'), 'World 2 complete screen');
  await page.screenshot({ path: `${OUT}/${name}-w2-8-nivel-concluido.png` });
  check((await save()).world2?.done === true, 'World 2 completion saved');
  await page.goto(BASE + '/', { waitUntil: 'networkidle' }); await sleep(1200);
  await page.screenshot({ path: `${OUT}/${name}-9-titulo-progresso.png` });

  const sw = await page.evaluate(async () => { const r = await Promise.race([navigator.serviceWorker.ready.then(() => true), new Promise((res) => setTimeout(() => res(false), 4000))]); return r; });
  log('service worker ready:', sw);
  if (!sw) { failures++; }

  await page.goto(BASE + '/privacidade/', { waitUntil: 'networkidle' });
  log('privacy title:', await page.title());
  await page.screenshot({ path: `${OUT}/${name}-8-privacidade.png` });

  log('console errors:', errors.length ? errors : 'none');
  if (errors.length) failures++;
  await ctx.close();
}

await run('mobile-390x844', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await run('desktop-1280x800', { viewport: { width: 1280, height: 800 } });
await browser.close();
console.log(failures ? `FAILURES: ${failures}` : 'ALL CHECKS PASSED');
process.exit(failures ? 1 : 0);
