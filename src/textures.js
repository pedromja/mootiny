// Todas as texturas desenhadas por código (sem ficheiros de arte externos).
const INK = 0x1c1410;

function make(scene, key, w, h, draw) {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

// Vaca de pé, virada para a direita. 48x64.
function cow(g, { frame = 0, eyes = 'open', bandana = 0xe8302a, spots = INK }) {
  const jump = frame === 3;
  const off = frame === 1 ? 4 : frame === 2 ? -4 : 0;
  g.lineStyle(2, INK, 1);
  // pernas
  const legs = jump ? [[13, 44, 12], [27, 42, 12]] : [[14 + off, 46, 14], [26 - off, 46, 14]];
  for (const [x, y, hgt] of legs) {
    g.fillStyle(0xffffff); g.fillRect(x, y, 8, hgt); g.strokeRect(x, y, 8, hgt);
    g.fillStyle(0x3a2e28); g.fillRect(x, y + hgt - 4, 8, 4);
  }
  // corpo
  g.fillStyle(0xffffff); g.fillRoundedRect(10, 26, 28, 24, 8); g.strokeRoundedRect(10, 26, 28, 24, 8);
  g.fillStyle(spots); g.fillEllipse(18, 40, 10, 7); g.fillEllipse(31, 45, 7, 5); g.fillEllipse(31, 33, 6, 4);
  // braços
  const armY = jump ? 24 : 31;
  g.fillStyle(0xffffff);
  g.fillRoundedRect(4, armY, 7, 13, 3); g.strokeRoundedRect(4, armY, 7, 13, 3);
  g.fillRoundedRect(37, armY, 7, 13, 3); g.strokeRoundedRect(37, armY, 7, 13, 3);
  g.fillStyle(0x3a2e28); g.fillRect(5, armY + 9, 5, 3); g.fillRect(38, armY + 9, 5, 3);
  // cornos e orelhas
  g.fillStyle(0xe8d8a8); g.fillTriangle(13, 9, 15, 0, 20, 7); g.fillTriangle(29, 7, 34, 0, 36, 9);
  g.lineStyle(1.5, INK, 1); g.strokeTriangle(13, 9, 15, 0, 20, 7); g.strokeTriangle(29, 7, 34, 0, 36, 9);
  g.fillStyle(0xf2a7b5); g.fillEllipse(8, 13, 11, 6); g.fillEllipse(41, 13, 11, 6);
  g.strokeEllipse(8, 13, 11, 6); g.strokeEllipse(41, 13, 11, 6);
  // cabeça
  g.lineStyle(2, INK, 1);
  g.fillStyle(0xffffff); g.fillRoundedRect(12, 4, 25, 25, 9); g.strokeRoundedRect(12, 4, 25, 25, 9);
  g.fillStyle(spots); g.fillEllipse(31, 9, 8, 6);
  // focinho
  g.fillStyle(0xf2a7b5); g.fillRoundedRect(19, 18, 19, 10, 5); g.lineStyle(1.5, INK, 1); g.strokeRoundedRect(19, 18, 19, 10, 5);
  g.fillStyle(0x9c4a5a); g.fillCircle(25, 23, 1.6); g.fillCircle(32, 23, 1.6);
  // olhos
  if (eyes === 'open') {
    g.fillStyle(0xffffff); g.fillCircle(21, 13, 4); g.fillCircle(31, 13, 4);
    g.lineStyle(1.2, INK, 1); g.strokeCircle(21, 13, 4); g.strokeCircle(31, 13, 4);
    g.fillStyle(INK); g.fillCircle(22, 13.5, 2.2); g.fillCircle(32, 13.5, 2.2);
    g.fillStyle(0xffffff); g.fillCircle(22.8, 12.4, 0.8); g.fillCircle(32.8, 12.4, 0.8);
  } else {
    g.lineStyle(2, INK, 1); g.lineBetween(18, 14, 24, 14); g.lineBetween(28, 14, 34, 14);
  }
  // bandana
  g.fillStyle(bandana); g.fillRect(12, 27, 25, 5); g.fillTriangle(17, 31, 25, 39, 31, 31); g.fillCircle(12, 29, 3);
  g.lineStyle(1.2, INK, 1); g.strokeTriangle(17, 31, 25, 39, 31, 31);
}

function can(g, frame, flat = false) {
  if (flat) {
    g.fillStyle(0xd9dee3); g.fillRoundedRect(2, 30, 32, 12, 3); g.lineStyle(2, INK); g.strokeRoundedRect(2, 30, 32, 12, 3);
    g.fillStyle(0x2d6cc4); g.fillRect(2, 34, 32, 4);
    g.lineStyle(2, INK); g.lineBetween(10, 33, 14, 37); g.lineBetween(14, 33, 10, 37); g.lineBetween(22, 33, 26, 37); g.lineBetween(26, 33, 22, 37);
    return;
  }
  const o = frame ? 3 : -3;
  g.fillStyle(INK); g.fillRect(10 + o, 36, 4, 8); g.fillRect(22 - o, 36, 4, 8); g.fillRect(8 + o, 42, 7, 2); g.fillRect(20 - o, 42, 7, 2);
  g.fillStyle(0xb8c0c8); g.fillRect(11, 3, 14, 7); g.fillStyle(0x9aa3ad); g.fillRect(8, 0, 20, 4);
  g.fillStyle(0xd9dee3); g.fillRoundedRect(5, 8, 26, 30, 5);
  g.lineStyle(2, INK); g.strokeRoundedRect(5, 8, 26, 30, 5); g.strokeRect(8, 0, 20, 4);
  g.fillStyle(0x2d6cc4); g.fillRect(6, 25, 24, 8);
  g.fillStyle(0xffffff); g.fillRect(9, 28, 18, 2);
  g.fillStyle(0xffffff); g.fillCircle(13, 17, 3.5); g.fillCircle(23, 17, 3.5);
  g.fillStyle(INK); g.fillCircle(14, 18, 1.8); g.fillCircle(24, 18, 1.8);
  g.lineStyle(2, INK); g.lineBetween(9, 11, 16, 14); g.lineBetween(27, 11, 20, 14);
}

export function makeTextures(scene) {
  make(scene, 'mimosa_idle', 48, 64, (g) => cow(g, { frame: 0 }));
  make(scene, 'mimosa_walk1', 48, 64, (g) => cow(g, { frame: 1 }));
  make(scene, 'mimosa_walk2', 48, 64, (g) => cow(g, { frame: 2 }));
  make(scene, 'mimosa_jump', 48, 64, (g) => cow(g, { frame: 3 }));
  make(scene, 'mimosa_sleepy', 48, 64, (g) => cow(g, { frame: 0, eyes: 'sleepy' }));
  make(scene, 'mana_sleepy', 48, 64, (g) => cow(g, { frame: 0, eyes: 'sleepy', bandana: 0x2d6cc4, spots: 0x7a4a2a }));
  make(scene, 'mana_happy', 48, 64, (g) => cow(g, { frame: 3, eyes: 'open', bandana: 0x2d6cc4, spots: 0x7a4a2a }));
  make(scene, 'can1', 36, 44, (g) => can(g, 0));
  make(scene, 'can2', 36, 44, (g) => can(g, 1));
  make(scene, 'can_flat', 36, 44, (g) => can(g, 0, true));

  make(scene, 'trevo', 24, 26, (g) => {
    g.lineStyle(2, 0x1d6b2a); g.lineBetween(12, 14, 15, 25);
    g.fillStyle(0x2fbf4a); g.lineStyle(1.5, 0x1d6b2a);
    for (const [x, y] of [[8, 8], [16, 8], [8, 15], [16, 15]]) { g.fillCircle(x, y, 5.5); g.strokeCircle(x, y, 5.5); }
    g.fillStyle(0xa8f0a0); g.fillCircle(7, 6, 1.6); g.fillCircle(15, 6, 1.6);
  });
  // cogumelo da consciência (intro)
  make(scene, 'cogumelo', 32, 32, (g) => {
    g.fillStyle(0xf3e9d2); g.fillRoundedRect(11, 16, 10, 15, 3); g.lineStyle(2, INK); g.strokeRoundedRect(11, 16, 10, 15, 3);
    g.fillStyle(0x8e44ad); g.fillEllipse(16, 15, 30, 18); g.strokeEllipse(16, 15, 30, 18);
    g.fillStyle(0xffffff); g.fillCircle(9, 13, 2.5); g.fillCircle(17, 9, 3); g.fillCircle(23, 15, 2.2);
  });
  // cogumelo dourado: duplo salto
  make(scene, 'poder', 40, 40, (g) => {
    g.fillStyle(0xfff3a0, 0.35); g.fillCircle(20, 20, 19);
    g.fillStyle(0xf3e9d2); g.fillRoundedRect(15, 21, 10, 14, 3); g.lineStyle(2, INK); g.strokeRoundedRect(15, 21, 10, 14, 3);
    g.fillStyle(0xf5c518); g.fillEllipse(20, 19, 30, 18); g.strokeEllipse(20, 19, 30, 18);
    g.fillStyle(0xffffff); g.fillCircle(13, 17, 2.5); g.fillCircle(21, 13, 3); g.fillCircle(27, 19, 2.2);
    g.fillStyle(INK); g.fillTriangle(20, 28, 17, 32, 23, 32);
  });
  make(scene, 'relva', 64, 26, (g) => {
    g.fillStyle(0x8a5a33); g.fillRect(0, 12, 64, 14);
    g.fillStyle(0x4caf50); g.fillRect(0, 0, 64, 16);
    g.fillStyle(0x6fd36f); g.fillRect(0, 0, 64, 4);
    g.fillStyle(0x3a8f3e); for (let x = 2; x < 64; x += 8) g.fillTriangle(x, 16, x + 4, 16, x + 2, 21);
  });
  make(scene, 'terra', 64, 64, (g) => {
    g.fillStyle(0x8a5a33); g.fillRect(0, 0, 64, 64);
    g.fillStyle(0x6e4527); for (const [x, y] of [[8, 10], [40, 6], [24, 30], [52, 40], [12, 50], [36, 56]]) g.fillEllipse(x, y, 9, 5);
    g.fillStyle(0xa4703f); for (const [x, y] of [[20, 14], [50, 22], [6, 34], [30, 46]]) g.fillCircle(x, y, 2);
  });
  make(scene, 'plataforma', 64, 20, (g) => {
    g.fillStyle(0x9c6b3c); g.fillRect(0, 6, 64, 14); g.fillStyle(0x7a5130); g.fillRect(0, 12, 64, 2); g.fillRect(31, 6, 2, 14);
    g.fillStyle(0x4caf50); g.fillRect(0, 0, 64, 7); g.fillStyle(0x6fd36f); g.fillRect(0, 0, 64, 2);
    g.lineStyle(2, INK); g.lineBetween(0, 19, 64, 19);
  });
  make(scene, 'feno', 64, 40, (g) => {
    g.fillStyle(0xe7c35a); g.fillRoundedRect(1, 1, 62, 38, 6); g.lineStyle(2, 0x8a6a1a); g.strokeRoundedRect(1, 1, 62, 38, 6);
    g.lineStyle(1.5, 0xc7a03a); for (let y = 8; y < 38; y += 7) g.lineBetween(4, y, 60, y);
    g.lineStyle(3, 0xb8452d); g.lineBetween(18, 1, 18, 39); g.lineBetween(46, 1, 46, 39);
  });
  make(scene, 'cardo', 32, 30, (g) => {
    g.lineStyle(3, 0x2e7d32); g.lineBetween(16, 30, 16, 14); g.lineBetween(16, 22, 8, 16); g.lineBetween(16, 22, 24, 16);
    g.fillStyle(0x7b1fa2); for (let i = 0; i < 9; i++) { const a = Math.PI + (i / 8) * Math.PI; g.fillTriangle(16, 10, 16 + Math.cos(a) * 12 - 2, 10 + Math.sin(a) * 12, 16 + Math.cos(a) * 12 + 2, 10 + Math.sin(a) * 12); }
    g.fillStyle(0x558b2f); g.fillCircle(16, 12, 6); g.lineStyle(1.5, INK); g.strokeCircle(16, 12, 6);
  });
  make(scene, 'bandeira', 40, 70, (g) => {
    g.fillStyle(0x6e4527); g.fillRect(4, 4, 5, 66); g.fillStyle(0xf5c518); g.fillCircle(6.5, 4, 4);
  });
  make(scene, 'pano_off', 40, 70, (g) => { g.fillStyle(0x9e9e9e); g.fillTriangle(9, 40, 36, 47, 9, 56); });
  make(scene, 'pano_on', 40, 70, (g) => { g.fillStyle(0xe8302a); g.fillTriangle(9, 8, 38, 16, 9, 26); g.fillStyle(0xffffff); g.fillCircle(17, 16, 3); });
  make(scene, 'placa', 64, 56, (g) => {
    g.fillStyle(0x6e4527); g.fillRect(29, 26, 6, 30);
    g.fillStyle(0xc89a5c); g.fillRoundedRect(2, 2, 60, 30, 4); g.lineStyle(2, INK); g.strokeRoundedRect(2, 2, 60, 30, 4);
    g.fillStyle(INK); g.fillRect(12, 12, 40, 3); g.fillRect(12, 20, 28, 3);
  });
  make(scene, 'portao', 16, 70, (g) => {
    g.fillStyle(0xc89a5c); g.fillRect(2, 0, 12, 70); g.lineStyle(2, INK); g.strokeRect(2, 0, 12, 70);
    g.fillStyle(0xe8302a); g.fillRect(2, 30, 12, 8); g.fillStyle(0x9aa3ad); g.fillRect(10, 32, 6, 4);
  });
  make(scene, 'nuvem', 128, 56, (g) => {
    g.fillStyle(0xffffff, 0.95); g.fillCircle(34, 34, 20); g.fillCircle(62, 24, 24); g.fillCircle(92, 32, 20); g.fillRoundedRect(16, 30, 96, 24, 12);
  });
  make(scene, 'coracao', 22, 20, (g) => {
    g.fillStyle(0xe8302a); g.fillCircle(6, 6, 6); g.fillCircle(16, 6, 6); g.fillTriangle(0.5, 8, 21.5, 8, 11, 20);
    g.fillStyle(0xffffff, 0.6); g.fillCircle(5, 4, 2);
  });
  make(scene, 'coracao_vazio', 22, 20, (g) => {
    g.fillStyle(0x000000, 0.35); g.fillCircle(6, 6, 6); g.fillCircle(16, 6, 6); g.fillTriangle(0.5, 8, 21.5, 8, 11, 20);
  });
  make(scene, 'faisca', 10, 10, (g) => { g.fillStyle(0xffffff); g.fillCircle(5, 5, 5); });
  makeFarmTextures(scene);
}

function farmer(g, frame, flat = false) {
  if (flat) {
    g.fillStyle(0x3b6db3); g.fillEllipse(24, 56, 44, 14); g.fillStyle(0xf1c27d); g.fillCircle(8, 54, 6);
    g.fillStyle(0xe8c547); g.fillEllipse(6, 48, 16, 6);
    g.lineStyle(2, INK); g.strokeEllipse(24, 56, 44, 14);
    return;
  }
  const o = frame ? 3 : -3;
  g.lineStyle(2, INK);
  g.fillStyle(0x5a3a22); g.fillRect(14 + o, 52, 8, 10); g.fillRect(26 - o, 52, 8, 10); // botas
  g.fillStyle(0x3b6db3); g.fillRect(14 + o, 44, 8, 10); g.fillRect(26 - o, 44, 8, 10);
  g.fillStyle(0xd94b3d); g.fillEllipse(24, 36, 34, 26); g.strokeEllipse(24, 36, 34, 26); // barriga (camisa xadrez)
  g.fillStyle(0xa83226); g.fillRect(12, 30, 24, 2); g.fillRect(12, 38, 24, 2); g.fillRect(19, 24, 2, 24); g.fillRect(28, 24, 2, 24);
  g.fillStyle(0x3b6db3); g.fillRoundedRect(14, 32, 20, 16, 4); g.fillRect(16, 22, 3, 12); g.fillRect(29, 22, 3, 12); // jardineiras
  g.fillStyle(0xf1c27d); g.fillCircle(24, 14, 10); g.strokeCircle(24, 14, 10); // cabeça
  g.fillStyle(0x8a5a33); g.fillRect(16, 19, 16, 3); // bigode
  g.fillStyle(INK); g.fillCircle(20, 12, 1.6); g.fillCircle(28, 12, 1.6);
  g.lineStyle(2, INK); g.lineBetween(16, 8, 22, 10); g.lineBetween(32, 8, 26, 10); // sobrolho zangado
  g.fillStyle(0xe8c547); g.fillEllipse(24, 5, 34, 6); g.fillRoundedRect(16, -2, 16, 8, 3); // chapéu de palha
  g.fillStyle(0xf1c27d); g.fillCircle(7 + (frame ? 1 : 0), 34, 4); g.fillCircle(41 - (frame ? 1 : 0), 34, 4);
}

function machine(g, mode) {
  // Super Ordenhadeira 3000, virada para a esquerda. 160x100.
  const dead = mode === 'dead';
  const steel = dead ? 0x7d7d7d : 0xb8c0c8;
  g.lineStyle(3, INK);
  g.fillStyle(0x333333); g.fillCircle(32, 86, 13); g.fillCircle(128, 86, 13); g.fillStyle(0x888888); g.fillCircle(32, 86, 5); g.fillCircle(128, 86, 5);
  g.fillStyle(steel); g.fillRoundedRect(10, 30, 140, 56, 10); g.strokeRoundedRect(10, 30, 140, 56, 10);
  g.fillStyle(dead ? 0x9e9e9e : 0xf4f7fa); g.fillRoundedRect(46, 12, 70, 26, 8); g.strokeRoundedRect(46, 12, 70, 26, 8);
  g.fillStyle(0x2d6cc4); g.fillRect(48, 22, 66, 6);
  if (mode === 'stun') {
    g.fillStyle(0xfff3a0, 0.5); g.fillCircle(81, 10, 14);
    g.fillStyle(0xe8302a); g.fillCircle(81, 10, 9); g.strokeCircle(81, 10, 9); g.fillStyle(0xffffff); g.fillCircle(78, 7, 3);
  } else if (!dead) {
    g.fillStyle(0x9aa3ad); g.fillEllipse(81, 12, 26, 12); g.strokeEllipse(81, 12, 26, 12);
  }
  // cara
  const eye = mode === 'stun' ? 0xffffff : dead ? 0x444444 : 0xe8302a;
  g.fillStyle(0x1c1410); g.fillCircle(30, 50, 11); g.fillCircle(58, 50, 11);
  g.fillStyle(eye); g.fillCircle(30, 50, 7); g.fillCircle(58, 50, 7);
  if (mode === 'stun') { g.lineStyle(2, INK); g.lineBetween(25, 45, 35, 55); g.lineBetween(35, 45, 25, 55); g.lineBetween(53, 45, 63, 55); g.lineBetween(63, 45, 53, 55); }
  g.fillStyle(0x555555); for (let x = 22; x < 70; x += 10) g.fillRect(x, 66, 6, 12);
  // tubos
  g.lineStyle(4, 0x666666); g.lineBetween(10, 40, 2, 58); g.lineBetween(10, 52, 4, 70);
  g.fillStyle(0xffffff); g.fillRect(96, 46, 44, 14); g.fillStyle(INK); g.fillRect(100, 50, 36, 6);
}

function makeFarmTextures(scene) {
  make(scene, 'agricultor1', 48, 64, (g) => farmer(g, 0));
  make(scene, 'agricultor2', 48, 64, (g) => farmer(g, 1));
  make(scene, 'agricultor_flat', 48, 64, (g) => farmer(g, 0, true));
  make(scene, 'trator', 112, 72, (g) => {
    g.lineStyle(3, INK);
    g.fillStyle(0x2e8b3d); g.fillRoundedRect(8, 26, 70, 26, 6); g.strokeRoundedRect(8, 26, 70, 26, 6);
    g.fillStyle(0x2e8b3d); g.fillRect(56, 4, 40, 40); g.strokeRect(56, 4, 40, 40);
    g.fillStyle(0xbfe6ff); g.fillRect(62, 10, 28, 18); g.strokeRect(62, 10, 28, 18);
    g.fillStyle(0x666666); g.fillRect(24, 8, 8, 20); g.fillStyle(0x333333); g.fillRect(22, 4, 12, 6);
    g.fillStyle(0xfff3a0); g.fillCircle(10, 34, 5); g.strokeCircle(10, 34, 5); // farol
    g.lineStyle(2, INK); g.lineBetween(4, 28, 14, 31);
    g.fillStyle(0x222222); g.fillCircle(84, 54, 17); g.fillCircle(26, 60, 11);
    g.fillStyle(0xf5c518); g.fillCircle(84, 54, 8); g.fillCircle(26, 60, 5);
  });
  make(scene, 'ferradura', 40, 40, (g) => {
    g.fillStyle(0xfff3a0, 0.35); g.fillCircle(20, 20, 19);
    g.lineStyle(7, 0xf5c518); g.beginPath(); g.arc(20, 20, 11, Math.PI * 0.8, Math.PI * 2.2, false); g.strokePath();
    g.fillStyle(0xe8302a); g.fillTriangle(22, 6, 12, 22, 20, 22); g.fillTriangle(18, 34, 28, 18, 20, 18);
  });
  make(scene, 'ordenhadeira', 160, 100, (g) => machine(g, 'idle'));
  make(scene, 'ordenhadeira_stun', 160, 100, (g) => machine(g, 'stun'));
  make(scene, 'ordenhadeira_dead', 160, 100, (g) => machine(g, 'dead'));
  make(scene, 'gota', 18, 22, (g) => {
    g.fillStyle(0xffffff); g.fillCircle(9, 14, 7); g.fillTriangle(3, 12, 15, 12, 9, 1);
    g.lineStyle(2, 0x9aa3ad); g.strokeCircle(9, 14, 7);
  });
  make(scene, 'jaula', 76, 80, (g) => {
    g.lineStyle(4, 0x555555); g.strokeRect(4, 10, 68, 68);
    for (let x = 16; x < 72; x += 12) g.lineBetween(x, 10, x, 78);
    g.lineStyle(3, 0x444444); g.lineBetween(38, 0, 38, 10);
  });
  make(scene, 'mana2_sleepy', 48, 64, (g) => cow(g, { eyes: 'sleepy', bandana: 0x2fbf4a, spots: 0x1c1410 }));
  make(scene, 'mana2_happy', 48, 64, (g) => cow(g, { frame: 3, bandana: 0x2fbf4a, spots: 0x1c1410 }));
  make(scene, 'mana3_sleepy', 48, 64, (g) => cow(g, { eyes: 'sleepy', bandana: 0xf5c518, spots: 0x7a4a2a }));
  make(scene, 'mana3_happy', 48, 64, (g) => cow(g, { frame: 3, bandana: 0xf5c518, spots: 0x7a4a2a }));
  make(scene, 'mana4_sleepy', 48, 64, (g) => cow(g, { eyes: 'sleepy', bandana: 0x8e44ad, spots: 0x1c1410 }));
  make(scene, 'mana4_happy', 48, 64, (g) => cow(g, { frame: 3, bandana: 0x8e44ad, spots: 0x1c1410 }));
}
