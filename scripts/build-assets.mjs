// Copia e prepara a arte/áudio/intro de /workspace/mootiny-art para public/ (só o que o jogo usa).
// Também desenha os adereços em falta (cardo, bandeira, cogumelos, ferradura, jaula, portão, cercado, gota, placa,
// botão táctil de arranque, peles de botão) no mesmo estilo, e corta a intro em camadas animáveis.
// Correr: node scripts/build-assets.mjs   (precisa de ../mootiny-art com node_modules)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const ART = process.env.ART || path.resolve('../mootiny-art');
const PUB = path.resolve('public/assets');
const L = await import(path.join(ART, 'src/lib.mjs'));
const C = await import(path.join(ART, 'src/characters.mjs'));
const U = await import(path.join(ART, 'src/ui.mjs'));
const { svgDoc, render, O, BRAND, fileData } = L;
const mk = (p) => fs.mkdirSync(p, { recursive: true });
for (const d of ['art', 'audio/classico', 'audio/mootiny', 'audio/music', 'fonts', 'intro']) mk(path.join(PUB, d));

// ---------- 1) arte pronta ----------
const SPRITES = ['mimosa', 'mana', 'mana2', 'mana3', 'mana4', 'can', 'agricultor', 'trator', 'ordenhadeira', 'trevo', 'relva', 'terra', 'plataforma', 'feno',
  'coracao', 'coracao_vazio', 'faisca', 'cerca', 'btn_jogar', 'btn_jogar_down', 'btn_menu', 'btn_som', 'btn_som_off', 'btn_pausa', 'touch_left', 'touch_right', 'touch_jump', 'logo'];
for (const n of SPRITES) fs.copyFileSync(path.join(ART, 'png', n + '.png'), path.join(PUB, 'art', n + '.png'));
for (const w of ['ilha', 'quinta']) for (const l of ['sky', 'far', 'mid', 'near']) {
  // as camadas com transparência são cortadas por cima (menos píxeis a desenhar por frame; o fundo fica alinhado pela base)
  let img = sharp(path.join(ART, 'png', `bg_${w}_${l}.png`));
  if (l !== 'sky') {
    const { data, info } = await img.clone().raw().toBuffer({ resolveWithObject: true });
    let top = 0;
    outer: for (; top < info.height; top++) for (let x = 0; x < info.width; x++) if (data[(top * info.width + x) * 4 + 3] > 0) break outer;
    top = Math.max(0, top - 4);
    img = sharp(await img.extract({ left: 0, top, width: info.width, height: info.height - top }).png().toBuffer());
  }
  await img.webp({ quality: l === 'sky' ? 80 : 86, alphaQuality: 90, effort: 6 }).toFile(path.join(PUB, 'art', `bg_${w}_${l}.webp`));
}

// ---------- 2) áudio (só .ogg e .mp3; os .wav ficam de fora) ----------
for (const p of ['classico', 'mootiny', 'music']) {
  for (const f of fs.readdirSync(path.join(ART, 'audio', p))) if (/\.(ogg|mp3)$/.test(f)) fs.copyFileSync(path.join(ART, 'audio', p, f), path.join(PUB, 'audio', p, f));
}

// ---------- 3) fonte Luckiest Guy (Apache-2.0), subconjunto latino em woff ----------
execFileSync('python3', ['-m', 'fontTools.subset', path.join(ART, 'fonts/LuckiestGuy-Regular.ttf'), '--unicodes=U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2022,U+2026,U+20AC',
  '--flavor=woff', `--output-file=${path.join(PUB, 'fonts/luckiest-guy.woff')}`]);
fs.writeFileSync(path.join(PUB, 'fonts/LICENSE-LuckiestGuy.txt'), 'Luckiest Guy by Astigmatic — Apache License 2.0 — https://www.apache.org/licenses/LICENSE-2.0\n');

// ---------- 4) adereços novos no mesmo estilo (2x) ----------
const WOOD = `<linearGradient id="gWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e0a066"/><stop offset="0.5" stop-color="#b06a36"/><stop offset="1" stop-color="#6e3a1a"/></linearGradient>
<linearGradient id="gWoodH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a4420"/><stop offset="0.35" stop-color="#d89a5e"/><stop offset="1" stop-color="#8a5028"/></linearGradient>
<linearGradient id="gMilk" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cfe2f3"/></linearGradient>`;
const gloss = (x, y, rx, ry, rot = -25) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity="0.8" transform="rotate(${rot} ${x} ${y})"/>`;
const one = (name, w, h, body) => render(svgDoc(w, h, body, WOOD), path.join(PUB, 'art', name + '.png'));
const sheet = (name, fw, fh, frames) => one(name, fw * frames.length, fh, frames.map((f, i) => `<g transform="translate(${i * fw} 0)">${f}</g>`).join(''));

// cardo 64x60
one('cardo', 64, 60, (() => {
  let crown = '';
  for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI; const b = a - 0.24, c = a + 0.24;
    crown += `<path d="M${32 + Math.cos(b) * 8},${24 + Math.sin(b) * 8} L${32 + Math.cos(a) * 25},${24 + Math.sin(a) * 25} L${32 + Math.cos(c) * 8},${24 + Math.sin(c) * 8}Z" fill="#c070ff" stroke="${O}" stroke-width="2" stroke-linejoin="round"/>`; }
  return `<path d="M32,58 v-22" stroke="${O}" stroke-width="8" stroke-linecap="round"/><path d="M32,58 v-22" stroke="#3fdc4f" stroke-width="3.5" stroke-linecap="round"/>
   <path d="M32,50 q-16,0 -24,-12 q14,-2 24,8z M32,46 q16,0 24,-12 q-14,-2 -24,8z" fill="url(#gGrass)" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>
   ${crown}<ellipse cx="32" cy="32" rx="14" ry="11" fill="url(#gClover)" stroke="${O}" stroke-width="3.5"/>
   <path d="M22,30 l20,8 M42,28 l-20,8 M26,24 l12,14 M38,24 l-12,14" stroke="#0f7a35" stroke-width="2" opacity="0.8"/>${gloss(26, 27, 5, 2.5)}`;
})());
// bandeira 80x140 ×2 [off, on]
const pole = `<rect x="8" y="12" width="10" height="126" rx="4" fill="url(#gChrome)" stroke="${O}" stroke-width="3"/><circle cx="13" cy="12" r="9" fill="url(#gGold)" stroke="${O}" stroke-width="3"/>${gloss(10, 9, 3, 2)}`;
sheet('bandeira', 80, 140, [
  `${pole}<path d="M18,84 q20,-6 32,2 t26,0 l-6,13 6,13 q-14,4 -26,-2 t-32,0z" fill="url(#gChromeV)" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>`,
  `${pole}<path d="M18,20 q20,-6 32,2 t26,0 l-6,13 6,13 q-14,4 -26,-2 t-32,0z" fill="url(#gRed)" stroke="${O}" stroke-width="3" stroke-linejoin="round"/>
   <path d="M40,24 l3,7 7,1 -5,5 1,7 -6,-3 -6,3 1,-7 -5,-5 7,-1z" fill="url(#gGold)" stroke="${O}" stroke-width="1.8"/><path d="M22,24 q14,-4 24,0" stroke="#fff" stroke-width="2.5" opacity="0.7" fill="none"/>`,
]);
// cogumelo dourado (duplo salto) 80x80
const mushCap = (fill, spots) => `<path d="M30,74 q-4,-16 2,-28 h16 q6,12 2,28z" fill="#fff8e6" stroke="${O}" stroke-width="3.5"/>
  <path d="M8,46 q0,-34 32,-36 q32,2 32,36 q-32,10 -64,0z" fill="${fill}" stroke="${O}" stroke-width="4"/>
  ${spots.map(([a, b, r]) => `<circle cx="${a}" cy="${b}" r="${r}" fill="#fff" stroke="${O}" stroke-width="2"/>`).join('')}${gloss(24, 22, 9, 4)}
  <circle cx="35" cy="58" r="2.6" fill="${O}"/><circle cx="45" cy="58" r="2.6" fill="${O}"/><path d="M36,64 q4,3 8,0" stroke="${O}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
one('poder', 80, 80, `<circle cx="40" cy="42" r="38" fill="url(#gGlow)" opacity="0.8"/>${mushCap('url(#gGold)', [[24, 34, 5], [42, 24, 6], [58, 36, 4.5]])}
  <path d="M66,10 l3,7 7,3 -7,3 -3,7 -3,-7 -7,-3 7,-3z" fill="#fff"/>`);
// cogumelo da intro (brilha verde) 96x96
one('cogumelo', 96, 96, `<circle cx="48" cy="56" r="46" fill="url(#gGlowG)"/><g transform="translate(48 92) scale(1.05)">
   <path d="M-12,0 q-4,-22 2,-34 h20 q6,12 2,34z" fill="#fff8e6" stroke="${O}" stroke-width="3.5"/>
   <path d="M-40,-30 q0,-34 40,-36 q40,2 40,36 q-40,10 -80,0z" fill="url(#gPurple)" stroke="${O}" stroke-width="4"/>
   ${[[-22, -42, 6], [2, -54, 7], [22, -40, 5], [-6, -36, 4]].map(([a, b, r]) => `<circle cx="${a}" cy="${b}" r="${r}" fill="#b6ff6a" stroke="${O}" stroke-width="2"/>`).join('')}
   <ellipse cx="-20" cy="-56" rx="10" ry="4" fill="#fff" opacity="0.7" transform="rotate(-25 -20 -56)"/></g>`);
// ferradura-turbo 80x80
one('ferradura', 80, 80, `<circle cx="40" cy="40" r="38" fill="url(#gGlow)" opacity="0.8"/>
  <path d="M18,66 V38 a22,22 0 0 1 44,0 V66" fill="none" stroke="${O}" stroke-width="20" stroke-linecap="round"/>
  <path d="M18,66 V38 a22,22 0 0 1 44,0 V66" fill="none" stroke="url(#gGold)" stroke-width="12" stroke-linecap="round"/>
  ${[[18, 46], [18, 60], [62, 46], [62, 60], [26, 24], [54, 24]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="${O}"/>`).join('')}
  <path d="M44,22 l-12,22 h9 l-6,20 16,-26 h-9 l6,-16z" fill="url(#gRed)" stroke="${O}" stroke-width="2.8" stroke-linejoin="round"/>
  <path d="M22,30 a18,18 0 0 1 10,-10" stroke="#fff" stroke-width="3" fill="none" opacity="0.8" stroke-linecap="round"/>`);
// jaula 152x160
one('jaula', 152, 160, `<circle cx="76" cy="12" r="9" fill="none" stroke="${O}" stroke-width="8"/><circle cx="76" cy="12" r="9" fill="none" stroke="url(#gChrome)" stroke-width="4"/>
  ${[22, 44, 66, 88, 110, 130].map((x) => `<rect x="${x - 4}" y="28" width="8" height="122" rx="4" fill="url(#gChrome)" stroke="${O}" stroke-width="2.6"/>`).join('')}
  <rect x="8" y="20" width="136" height="16" rx="8" fill="url(#gChromeV)" stroke="${O}" stroke-width="3.5"/>
  <rect x="8" y="142" width="136" height="14" rx="7" fill="url(#gChromeV)" stroke="${O}" stroke-width="3.5"/>
  <rect x="62" y="96" width="28" height="22" rx="5" fill="url(#gGold)" stroke="${O}" stroke-width="3"/><path d="M68,96 v-8 a8,8 0 0 1 16,0 v8" fill="none" stroke="${O}" stroke-width="3.5"/><circle cx="76" cy="106" r="3" fill="${O}"/>`);
// portão 32x140
one('portao', 32, 140, `<rect x="4" y="4" width="24" height="132" rx="6" fill="url(#gWoodH)" stroke="${O}" stroke-width="3.5"/>
  <rect x="2" y="60" width="28" height="16" rx="4" fill="url(#gRed)" stroke="${O}" stroke-width="3"/><rect x="20" y="64" width="12" height="8" rx="3" fill="url(#gChromeV)" stroke="${O}" stroke-width="2"/>
  <rect x="9" y="10" width="5" height="120" rx="2.5" fill="#fff" opacity="0.35"/>`);
// cercado 440x130 (postes + travessas) da Mana Estrela
one('cercado', 440, 130, `${[20, 100, 180, 260, 340, 420].map((x) => `<rect x="${x - 9}" y="6" width="18" height="122" rx="6" fill="url(#gWoodH)" stroke="${O}" stroke-width="3.5"/><circle cx="${x}" cy="16" r="4" fill="url(#gGold)" stroke="${O}" stroke-width="1.5"/>`).join('')}
  ${[30, 82].map((y) => `<rect x="4" y="${y}" width="432" height="18" rx="7" fill="url(#gWood)" stroke="${O}" stroke-width="3.5"/><rect x="12" y="${y + 3}" width="416" height="4" rx="2" fill="#fff" opacity="0.35"/>`).join('')}`);
// gota de leite 36x44
one('gota', 36, 44, `<path d="M18,3 C26,16 32,24 32,30 a14,14 0 0 1 -28,0 C4,24 10,16 18,3Z" fill="url(#gMilk)" stroke="${O}" stroke-width="3.2"/>${gloss(12, 28, 3.5, 6, 10)}`);
// placa 128x112
one('placa', 128, 112, `<rect x="56" y="50" width="16" height="60" rx="5" fill="url(#gWoodH)" stroke="${O}" stroke-width="3.5"/>
  <rect x="6" y="6" width="116" height="58" rx="12" fill="url(#gGold)" stroke="${O}" stroke-width="4"/><rect x="14" y="13" width="100" height="44" rx="8" fill="url(#gWood)" stroke="${O}" stroke-width="2.5"/>
  <text x="64" y="47" font-family="Luckiest Guy" font-size="30" text-anchor="middle" fill="#fff" stroke="${O}" stroke-width="6" paint-order="stroke">!</text>${gloss(30, 18, 12, 3, 0)}`);
// botão táctil de arranque 140x140 (marca de água, como os outros)
{ const c = 70; one('touch_dash', 140, 140, `<circle cx="${c}" cy="${c}" r="${c - 4}" fill="#1C1410" fill-opacity="0.28" stroke="#ffd43b" stroke-opacity="0.85" stroke-width="4"/>
  <circle cx="${c}" cy="${c}" r="${c - 12}" fill="url(#gGloss)" opacity="0.35"/>
  <path d="M${c - 30},${c - 20} L${c - 4},${c} L${c - 30},${c + 20}z M${c - 2},${c - 20} L${c + 24},${c} L${c - 2},${c + 20}z" fill="#ffd43b"/>`); }
// peles de botão sem texto (para nineslice): 360x120
for (const [k, g] of [['red', 'gRed'], ['blue', 'gBlue'], ['purple', 'gPurple'], ['teal', 'gTeal'], ['green', 'gGrass'], ['grey', 'gChromeV']]) {
  one(`pill_${k}`, 360, 120, U.pill(360, 120, g, null));
}

// ---------- 5) intro em camadas ----------
const W = 1280, H = 800;
const bgUri = Object.fromEntries(['sky', 'far', 'mid', 'near'].map((l) => [l, fileData(path.join(ART, 'png/bg_ilha_' + l + '.png'))]));
const img = (l) => `<image href="${bgUri[l]}" width="${W}" height="${H}"/>`;
const SIS = [['#2d6cc4', '#8fc0ff', '#7a4a2a'], ['#2fbf4a', '#a0ff9a', '#1C1410'], ['#f5c518', '#fff1a0', '#7a4a2a'], ['#8e44ad', '#e0a8ff', '#1C1410']];
const sis = (i, pose, x, y, s = 1.3, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s}) translate(-48 -124)">${C.cow(pose, { bandana: SIS[i][0], bandHi: SIS[i][1], spots: SIS[i][2] })}</g>`;
const mim = (pose, x, y, s = 1.5, rot = 0, band = false) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s}) translate(-48 -124)">${C.cow(pose, band ? {} : { bandana: null })}</g>`;
const T = (x, y, t, size, fill = '#fff', anchor = 'middle', rot = 0) => `<text x="${x}" y="${y}" transform="rotate(${rot} ${x} ${y})" font-family="Luckiest Guy" font-size="${size}" text-anchor="${anchor}" fill="${fill}" stroke="${O}" stroke-width="${size * 0.2}" paint-order="stroke" stroke-linejoin="round">${t}</text>`;
const night = (level = 0.55) => img('sky') + `<rect width="${W}" height="${H}" fill="#0a0628" opacity="${level}"/>` + img('far') + `<rect width="${W}" height="${H}" fill="#0a0628" opacity="${level * 0.8}"/>` + img('mid') + `<rect width="${W}" height="${H}" fill="#0a0628" opacity="${level * 0.6}"/>`;
const near = (level = 0.4) => img('near') + `<rect y="700" width="${W}" height="100" fill="#0a0628" opacity="${level}"/>`;
const bolt = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0,0 l-40,120 h34 l-30,120 l90,-150 h-38 l34,-90z" fill="#fff7a0" stroke="#fff" stroke-width="6" filter="url(#fGlow)"/><path d="M0,0 l-40,120 h34 l-30,120 l90,-150 h-38 l34,-90z" fill="#fff7a0" stroke="${O}" stroke-width="4"/></g>`;
const mushroom = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="0" cy="-30" r="56" fill="url(#gGlowG)"/>
   <path d="M-12,0 q-4,-22 2,-34 h20 q6,12 2,34z" fill="#fff8e6" stroke="${O}" stroke-width="3.5"/>
   <path d="M-40,-30 q0,-34 40,-36 q40,2 40,36 q-40,10 -80,0z" fill="url(#gPurple)" stroke="${O}" stroke-width="4"/>
   ${[[-22, -42, 6], [2, -54, 7], [22, -40, 5], [-6, -36, 4]].map(([a, b, r]) => `<circle cx="${a}" cy="${b}" r="${r}" fill="#b6ff6a" stroke="${O}" stroke-width="2"/>`).join('')}
   <ellipse cx="-20" cy="-56" rx="10" ry="4" fill="#fff" opacity="0.7" transform="rotate(-25 -20 -56)"/></g>`;
const beamSvg = (x, y, s, beam) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-46,20 L${-beam * 0.55},${beam} L${beam * 0.55},${beam} L46,20Z" fill="#7dff4a" opacity="0.28"/><path d="M-26,20 L${-beam * 0.3},${beam} L${beam * 0.3},${beam} L26,20Z" fill="#eaffc8" opacity="0.32"/>
     ${[0.3, 0.55, 0.8].map((k) => `<ellipse cx="0" cy="${beam * k}" rx="${46 + beam * k * 0.5}" ry="${8 + k * 6}" fill="none" stroke="#d6ffb0" stroke-width="3" opacity="0.5"/>`).join('')}</g>`;
const saucer = (x, y, s = 1, mood = 'grin') => `<g transform="translate(${x} ${y}) scale(${s})">
   <path d="M-6,-58 q-6,-16 4,-24" stroke="${O}" stroke-width="3" fill="none"/><circle cx="-2" cy="-84" r="5" fill="#ff5aa0" stroke="${O}" stroke-width="2"/>
   <path d="M-22,-8 q0,-48 22,-50 q22,2 22,50z" fill="#57e08a" stroke="${O}" stroke-width="3"/>
   <ellipse cx="0" cy="-30" rx="11" ry="12" fill="#fff" stroke="${O}" stroke-width="2.5"/><circle cx="2" cy="-28" r="6" fill="${O}"/><circle cx="4" cy="-31" r="2" fill="#fff"/>
   ${mood === 'grin' ? `<path d="M-9,-12 q9,7 18,0" stroke="${O}" stroke-width="2.5" fill="none" stroke-linecap="round"/>` : `<ellipse cx="0" cy="-11" rx="5" ry="4" fill="${O}"/>`}
   <ellipse cx="0" cy="-20" rx="38" ry="42" fill="url(#gGlass)" opacity="0.55" stroke="${O}" stroke-width="3.5"/>
   <ellipse cx="-14" cy="-44" rx="10" ry="5" fill="#fff" opacity="0.8" transform="rotate(-30 -14 -44)"/>
   <ellipse cx="0" cy="8" rx="92" ry="22" fill="url(#gChromeV)" stroke="${O}" stroke-width="4"/>
   <path d="M-84,10 q84,22 168,0" stroke="${BRAND}" stroke-width="6" fill="none"/>
   ${[-64, -32, 0, 32, 64].map((dx) => `<circle cx="${dx}" cy="${12 + Math.abs(dx) * -0.06}" r="6" fill="#ffe14a" stroke="${O}" stroke-width="2"/>`).join('')}
   <ellipse cx="0" cy="26" rx="34" ry="8" fill="#3a3a4a" stroke="${O}" stroke-width="3"/><ellipse cx="0" cy="26" rx="22" ry="4" fill="#b6ff6a"/></g>`;
const bubble = (x, y, w, h, text, tx, ty, size = 34) => `<g><path d="M${x + w * 0.3},${y + h * 0.8} L${tx},${ty} L${x + w * 0.55},${y + h * 0.9}Z" fill="#fff" stroke="${O}" stroke-width="4" stroke-linejoin="round"/>
   <ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" fill="#fff" stroke="${O}" stroke-width="4"/>
   <path d="M${x + w * 0.3},${y + h * 0.8} L${x + w * 0.55},${y + h * 0.9}" stroke="#fff" stroke-width="6"/>
   <text x="${x + w / 2}" y="${y + h / 2 + size * 0.36}" font-family="Luckiest Guy" font-size="${size}" text-anchor="middle" fill="${O}">${text}</text></g>`;
const sfxWord = (x, y, t, size, rot) => `<g>${Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2; const r1 = size * 1.6, r2 = size * 2.3; return `<path d="M${x + Math.cos(a) * r1},${y - size * 0.3 + Math.sin(a) * r1 * 0.6} L${x + Math.cos(a + 0.12) * r2},${y - size * 0.3 + Math.sin(a + 0.12) * r2 * 0.6} L${x + Math.cos(a + 0.24) * r1},${y - size * 0.3 + Math.sin(a + 0.24) * r1 * 0.6}Z" fill="#fff" stroke="${O}" stroke-width="2.5"/>`; }).join('')}
   <ellipse cx="${x}" cy="${y - size * 0.3}" rx="${size * 1.7}" ry="${size}" fill="#fff" stroke="${O}" stroke-width="3"/>${T(x, y, t, size, 'url(#gGold)', 'middle', rot)}</g>`;
const impact = ['#b6ff6a', '#fff'].map((c, i) => Array.from({ length: 8 }, (_, k) => { const a = (k / 8) * Math.PI; return `<path d="M${560 + Math.cos(a) * 110},${642 - Math.sin(a) * 30} l${Math.cos(a) * 40},${-Math.sin(a) * 20}" stroke="${c}" stroke-width="${6 - i * 3}" stroke-linecap="round"/>`; }).join('')).join('');
const sil = (x, label, shape) => `<g transform="translate(${x} 470)">${shape}${T(0, 40, label, 24, '#fff')}</g>`;

// cada camada: [chave, svg, efeito]. A primeira de cada painel é o fundo (opaco).
const PANELS = [
  { n: 1, layers: [
    ['bg', night(0.6) + sis(0, 'sleepy', 330, 630, 1.25) + sis(1, 'sleepy', 470, 642, 1.25) + mim('sleepy', 620, 642, 1.5) + sis(2, 'sleepy', 780, 635, 1.25) + sis(3, 'sleepy', 920, 630, 1.25) + near(0.5)],
    ['bolt', bolt(860, 40, 1.1), 'bolt'],
    ['word', sfxWord(1080, 150, 'CABRUM!', 46, -8), 'pop'],
  ] },
  { n: 2, layers: [
    ['bg', night(0.55) + near(0.45)],
    ['saucer', saucer(900, 120, 0.9), 'bob'],
    ['zap', `<path d="M900,150 l-60,140 l30,0 l-50,160" stroke="#b6ff6a" stroke-width="10" fill="none" filter="url(#fGlow)" stroke-linejoin="round"/>`, 'zap'],
    ['m1', mushroom(300, 620, 1), 'grow'], ['m2', mushroom(470, 630, 0.8), 'grow'], ['m3', mushroom(640, 635, 1.9), 'grow'], ['m4', mushroom(820, 630, 0.9), 'grow'], ['m5', mushroom(980, 620, 0.75), 'grow'],
    ['word', sfxWord(640, 330, 'ZÁS!', 52, -6), 'pop'],
  ] },
  { n: 3, layers: [
    ['bg', night(0.45) + near(0.35)],
    ['glow', `<circle cx="640" cy="500" r="170" fill="url(#gGlowG)"/>`, 'pulse'],
    ['herd', sis(0, 'glow', 300, 642, 1.3) + mushroom(360, 642, 0.5) + sis(1, 'glow', 450, 642, 1.3) + sis(2, 'glow', 860, 642, 1.3) + sis(3, 'glow', 1010, 642, 1.3), 'bob'],
    ['mimosa', mim('happy', 600, 642, 1.6) + mushroom(730, 642, 1.3), 'chomp'],
    ['word', sfxWord(640, 220, 'PLOP!', 64, -5), 'pop'],
  ] },
  { n: 4, layers: [
    ['bg', night(0.5) + mim('scared', 640, 642, 1.5) + near(0.4)],
    ['beam1', beamSvg(300, 140, 1, 560), 'beam'], ['beam2', beamSvg(980, 120, 1.05, 580), 'beam'],
    ['s1', sis(0, 'scared', 300, 420, 1.2, -14), 'float'], ['s2', sis(1, 'scared', 980, 470, 1.2, 12), 'float'],
    ['s3', sis(2, 'scared', 330, 640, 1.1, 18), 'float'], ['s4', sis(3, 'scared', 960, 280, 1.0, -20), 'float'],
    ['u1', saucer(300, 140, 1), 'bob'], ['u2', saucer(980, 120, 1.05), 'bob'], ['u3', saucer(650, 70, 0.7, 'o'), 'bob'],
    ['b1', bubble(130, 210, 190, 90, 'MUUU?!', 260, 330), 'pop'], ['b2', bubble(1050, 300, 190, 90, 'MUUUU!', 1010, 400), 'pop'],
  ] },
  { n: 5, layers: [
    ['bg', night(0.45) + near(0.35)],
    ['beam', beamSvg(640, 110, 1.1, 300), 'beam'],
    ['saucer', saucer(640, 110, 1.1, 'o'), 'bob'],
    ['bubble', bubble(820, 40, 240, 90, 'PESA MUITO!', 720, 120, 30), 'pop'],
    ['shadow', `<ellipse cx="560" cy="642" rx="120" ry="14" fill="#000" opacity="0.3"/>` + impact, 'land'],
    ['mimosa', mim('idle0', 560, 642, 1.8), 'drop'],
    ['word', sfxWord(830, 450, 'PUM!', 56, 8), 'pop'],
  ] },
  { n: 6, layers: [
    ['bg', img('sky') + `<rect width="${W}" height="${H}" fill="#ff8a5a" opacity="0.18"/>` + img('far') + img('mid') +
      `<path d="M640,260 Q900,200 1180,330" stroke="#fff" stroke-width="4" fill="none" stroke-dasharray="6 14"/>` +
      `<rect x="760" y="360" width="480" height="150" rx="20" fill="#1C1410" opacity="0.55"/>` +
      sil(850, 'A QUINTA', `<path d="M-40,0 v-40 l10,-24 h60 l10,24 v40z" fill="url(#gRed)" stroke="${O}" stroke-width="3"/>`) +
      sil(1000, 'A FÁBRICA', `<path d="M-50,0 v-40 l25,-15 v15 l25,-15 v15 l25,-15 v55z M30,-55 h12 v55 h-12z" fill="url(#gChromeV)" stroke="${O}" stroke-width="3"/>`) +
      sil(1150, 'A CIDADE', `<path d="M-40,0 v-50 h20 v-20 h20 v40 h18 v-56 h22 v86z" fill="url(#gGold)" stroke="${O}" stroke-width="3"/><path d="M8,-90 l6,-10 6,10 6,-10 6,10 v6 h-24z" fill="url(#gGold)" stroke="${O}" stroke-width="2"/>`) +
      T(1000, 345, 'REI QUEIJO &amp; CIA.', 26, 'url(#gGold)') + img('near')],
    ['u1', saucer(980, 220, 0.45), 'flyaway'], ['u2', saucer(1120, 290, 0.35), 'flyaway'], ['u3', saucer(840, 200, 0.4), 'flyaway'],
    ['glow', `<circle cx="300" cy="480" r="170" fill="url(#gGlow)" opacity="0.35"/>`, 'pulse'],
    ['mimosa', mim('jump', 330, 642, 2.1, 0, true), 'hop'],
    ['bubble', bubble(470, 200, 340, 110, 'VOU BUSCAR-VOS!', 400, 340, 32), 'pop'],
  ] },
];
const manifest = [];
for (const p of PANELS) {
  const layers = [];
  for (const [key, body, fx] of p.layers) {
    const png = render(svgDoc(W, H, body));
    const file = `p${p.n}_${key}.webp`;
    if (key === 'bg') {
      await sharp(png).flatten({ background: '#0a0628' }).webp({ quality: 78, effort: 6 }).toFile(path.join(PUB, 'intro', file));
      layers.push({ key: `intro${p.n}_bg`, file, x: 0, y: 0, w: W, h: H });
    } else {
      const { data, info } = await sharp(png).trim({ threshold: 1 }).toBuffer({ resolveWithObject: true });
      await sharp(data).webp({ quality: 86, alphaQuality: 90, effort: 6 }).toFile(path.join(PUB, 'intro', file));
      layers.push({ key: `intro${p.n}_${key}`, file, fx, x: -info.trimOffsetLeft, y: -info.trimOffsetTop, w: info.width, h: info.height });
    }
  }
  manifest.push({ n: p.n, layers });
}
fs.writeFileSync('src/intro-layers.json', JSON.stringify(manifest, null, 1));
console.log('assets ok');
