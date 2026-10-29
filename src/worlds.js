// Dados dos níveis. Coordenadas em píxeis do mundo; GT = topo do chão.
export const GT = 480;

const W1 = {
  id: 1, name: 'Ilha Verde', theme: 'ilha', W: 5200,
  grounds: [[0, 900, GT], [1010, 1520, GT], [1640, 2200, GT], [2200, 2600, GT - 150], [2860, 3600, GT], [3720, 4300, GT], [4620, 5200, GT]],
  pits: [[900, 1010], [1520, 1640], [2600, 2860], [3600, 3720], [4300, 4620]],
  plats: [[640, GT - 110, 128], [1180, GT - 115, 96], [1330, GT - 200, 96], [2980, GT - 110, 128], [3180, GT - 205, 96], [3400, GT - 110, 128], [3900, GT - 120, 128], [4360, GT - 60, 96], [4500, GT - 100, 96]],
  cans: [[620, 420, 880], [1300, 1060, 1500], [1900, 1700, 2180], [3150, 2900, 3580], [4000, 3760, 4280], [4720, 4650, 4880]],
  farmers: [], tractors: [], efences: [], hayWalls: [],
  thistles: [[1440, GT], [2440, GT - 150], [3330, GT], [4130, GT]],
  checkpoints: [[1960, GT], [3770, GT]],
  power: { type: 'doubleJump', x: 1840, y: GT - 34 },
  clovers: [
    [300, GT - 30], [340, GT - 30], [380, GT - 30], [670, GT - 150], [704, GT - 150], [738, GT - 150],
    [930, GT - 110], [960, GT - 130], [990, GT - 110], [1210, GT - 155], [1360, GT - 240], [1580, GT - 120],
    [2080, GT - 40], [2300, GT - 190], [2500, GT - 190], [2700, GT - 200], [2760, GT - 210],
    [3010, GT - 150], [3210, GT - 245], [3440, GT - 150], [3660, GT - 110], [3940, GT - 160],
    [4390, GT - 100], [4530, GT - 140], [4780, GT - 30],
  ],
  signs: [[240, '@tutorial'], [1700, 'Salta para cima das latas!\nOs cardos picam.'], [2120, 'Salta outra vez no ar:\nDUPLO SALTO!'], [4700, 'A Mana Estrela está no cercado.\nAbre o portão!']],
  goal: { type: 'gate', x: 4930 },
};

const W2 = {
  id: 2, name: 'A Quinta', theme: 'quinta', W: 6400,
  grounds: [[0, 1150, GT], [1270, 2350, GT], [2350, 2900, GT], [3240, 4200, GT], [4330, 6400, GT]],
  pits: [[1150, 1270], [2900, 3240], [4200, 4330]],
  plats: [[600, GT - 110, 128], [1500, GT - 135, 96], [1720, GT - 135, 96], [3600, GT - 120, 128], [4000, GT - 140, 96], [4900, GT - 110, 128], [5150, GT - 150, 96], [5780, GT - 110, 96], [6200, GT - 110, 96]],
  cans: [[4500, 4440, 4560]],
  farmers: [[800, 420, 1120], [3480, 3300, 3700], [5000, 4760, 5260]],
  tractors: [[1650, 1310, 1960], [4030, 3880, 4170]],
  efences: [[2160, 0], [3800, 900], [5350, 0], [5470, 1500]], // [x, desfasamento ms]
  hayWalls: [2800, 4680],
  thistles: [],
  checkpoints: [[2430, GT], [4420, GT], [5560, GT]],
  power: { type: 'dash', x: 2560, y: GT - 34 },
  clovers: [
    [250, GT - 30], [290, GT - 30], [330, GT - 30], [630, GT - 150], [664, GT - 150], [698, GT - 150],
    [1180, GT - 120], [1210, GT - 140], [1240, GT - 120], [1530, GT - 175], [1750, GT - 175], [2030, GT - 40],
    [2640, GT - 30], [2680, GT - 30], [2980, GT - 150], [3060, GT - 190], [3140, GT - 190], [3200, GT - 150],
    [3630, GT - 160], [4030, GT - 180], [4265, GT - 110], [4930, GT - 150], [5180, GT - 190], [5410, GT - 30],
    [5810, GT - 150], [6230, GT - 150],
  ],
  signs: [[160, 'Bem-vinda à Quinta.\nAs manas estão no estábulo.'], [1360, 'TRATOR! Não dá para pisar.\nSalta por cima.'],
    [1990, 'Cerca elétrica: espera\nque se desligue.'], [2660, '@dash'], [5610, 'Estábulo: cuidado com a\nSuper Ordenhadeira 3000!']],
  goal: { type: 'boss', ar0: 5640, ar1: 6400 },
};

export const WORLDS = { 1: W1, 2: W2 };
