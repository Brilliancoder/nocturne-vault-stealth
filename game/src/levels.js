export const TILE_SIZE = 48;
export const COLS = 25;
export const ROWS = 13;

export const LEVELS = [
  {
    id: 1,
    name: 'Gallery Wing',
    coins: 3,
    playerStart: { tx: 2, ty: 6 },
    relic: { tx: 12, ty: 11, name: 'Obsidian Astrolabe' },
    exit: { tx: 1, ty: 6 },
    grid: [
      '#########################',
      '#...S....#.....#....S...#',
      '#.C......#..C..#......C.#',
      '#........#.....#........#',
      '#..S..C...........C..S..#',
      '####.####..C.C..####.####',
      '#E..S...............S...#',
      '#.......C.......C.......#',
      '#..C.......S.S.......C..#',
      '#....####.......####....#',
      '#.S..#..C...C...C..#.S..#',
      '#....#.............#....#',
      '#########################',
    ],
    guards: [
      {
        name: 'Warden Kael',
        speed: 82,
        fovDeg: 68,
        range: 265,
        waypoints: [
          { tx: 4, ty: 4, pause: 0.7 },
          { tx: 11, ty: 4, pause: 0.9 },
          { tx: 19, ty: 4, pause: 0.7 },
          { tx: 11, ty: 4, pause: 0.6 },
        ],
      },
      {
        name: 'Sentry Vex',
        speed: 88,
        fovDeg: 66,
        range: 255,
        waypoints: [
          { tx: 19, ty: 6, pause: 0.6 },
          { tx: 6, ty: 6, pause: 0.8 },
          { tx: 6, ty: 8, pause: 0.6 },
          { tx: 19, ty: 8, pause: 0.8 },
        ],
      },
      {
        name: 'Vault Guard',
        speed: 78,
        fovDeg: 72,
        range: 250,
        waypoints: [
          { tx: 7, ty: 11, pause: 1.0 },
          { tx: 17, ty: 11, pause: 1.0 },
        ],
      },
    ],
  },
  {
    id: 2,
    name: 'Clockwork Archives',
    coins: 4,
    playerStart: { tx: 2, ty: 11 },
    relic: { tx: 22, ty: 2, name: 'Chrono Cipher' },
    exit: { tx: 1, ty: 11 },
    grid: [
      '#########################',
      '#S......C...#...C......S#',
      '#..C........#........C..#',
      '#.....###.......###.....#',
      '#..S..#.#..C.C..#.#..S..#',
      '#...........S...........#',
      '###.#####..###..#####.###',
      '#...S.......#.......S...#',
      '#..C....C...#...C....C..#',
      '#...........#...........#',
      '#..S..####.....####..S..#',
      '#E........C...C.........#',
      '#########################',
    ],
    guards: [
      {
        name: 'Archivist One',
        speed: 90,
        fovDeg: 70,
        range: 270,
        waypoints: [
          { tx: 9, ty: 11, pause: 0.6 },
          { tx: 21, ty: 11, pause: 0.8 },
          { tx: 21, ty: 9, pause: 0.5 },
          { tx: 13, ty: 9, pause: 0.7 },
        ],
      },
      {
        name: 'Gear Patrol',
        speed: 94,
        fovDeg: 68,
        range: 265,
        waypoints: [
          { tx: 3, ty: 9, pause: 0.6 },
          { tx: 3, ty: 5, pause: 0.6 },
          { tx: 11, ty: 5, pause: 0.7 },
          { tx: 21, ty: 5, pause: 0.6 },
          { tx: 11, ty: 5, pause: 0.5 },
        ],
      },
      {
        name: 'Cipher Captain',
        speed: 92,
        fovDeg: 74,
        range: 280,
        waypoints: [
          { tx: 14, ty: 2, pause: 0.8 },
          { tx: 22, ty: 2, pause: 0.9 },
          { tx: 22, ty: 5, pause: 0.6 },
          { tx: 14, ty: 5, pause: 0.6 },
        ],
      },
      {
        name: 'West Sweeper',
        speed: 86,
        fovDeg: 65,
        range: 255,
        waypoints: [
          { tx: 2, ty: 2, pause: 0.7 },
          { tx: 10, ty: 2, pause: 0.8 },
          { tx: 10, ty: 4, pause: 0.5 },
          { tx: 2, ty: 4, pause: 0.6 },
        ],
      },
    ],
  },
  {
    id: 3,
    name: 'Grand Nocturne Vault',
    coins: 4,
    playerStart: { tx: 2, ty: 6 },
    relic: { tx: 22, ty: 6, name: 'Nocturne Crown' },
    exit: { tx: 1, ty: 6 },
    grid: [
      '#########################',
      '#..S...C....#....C...S..#',
      '#......#.........#......#',
      '#..C...#..C...C..#...C..#',
      '#..........###..........#',
      '###.###..S..#..S..###.###',
      '#E......C.......C.......#',
      '###.###..S..#..S..###.###',
      '#..........###..........#',
      '#..C...#..C...C..#...C..#',
      '#......#.........#......#',
      '#..S...C....#....C...S..#',
      '#########################',
    ],
    guards: [
      {
        name: 'Outer Sentinel',
        speed: 96,
        fovDeg: 70,
        range: 270,
        waypoints: [
          { tx: 7, ty: 6, pause: 0.6 },
          { tx: 7, ty: 4, pause: 0.5 },
          { tx: 17, ty: 4, pause: 0.6 },
          { tx: 17, ty: 8, pause: 0.6 },
          { tx: 7, ty: 8, pause: 0.5 },
        ],
      },
      {
        name: 'North Vault',
        speed: 92,
        fovDeg: 72,
        range: 275,
        waypoints: [
          { tx: 10, ty: 2, pause: 0.7 },
          { tx: 16, ty: 2, pause: 0.7 },
          { tx: 19, ty: 2, pause: 0.6 },
          { tx: 19, ty: 4, pause: 0.5 },
          { tx: 10, ty: 4, pause: 0.6 },
        ],
      },
      {
        name: 'South Vault',
        speed: 92,
        fovDeg: 72,
        range: 275,
        waypoints: [
          { tx: 19, ty: 10, pause: 0.7 },
          { tx: 10, ty: 10, pause: 0.7 },
          { tx: 10, ty: 8, pause: 0.5 },
          { tx: 19, ty: 8, pause: 0.6 },
        ],
      },
      {
        name: 'Crown Warden',
        speed: 98,
        fovDeg: 78,
        range: 290,
        waypoints: [
          { tx: 22, ty: 2, pause: 0.8 },
          { tx: 22, ty: 10, pause: 0.8 },
          { tx: 20, ty: 6, pause: 0.9 },
        ],
      },
    ],
  },
];

export function tileAt(level, tx, ty) {
  if (ty < 0 || ty >= ROWS || tx < 0 || tx >= COLS) return '#';
  return level.grid[ty][tx];
}

export function isOpaqueTile(ch) {
  return ch === '#' || ch === 'C';
}

export function isSolidTile(ch) {
  return ch === '#' || ch === 'C';
}

export function isShadowTile(ch) {
  return ch === 'S';
}

export function tileCenter(tx, ty) {
  return { x: (tx + 0.5) * TILE_SIZE, y: (ty + 0.5) * TILE_SIZE };
}
