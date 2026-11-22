// GHOSTLIGHT — the three museum levels.
// One file, one job: level layouts, guard patrols, artifacts and coins.
// Map legend: '#' wall, '.' floor, 'S' shadow bush (hide here),
// 'C' crate (blocks sight and movement), 'P' player spawn,
// 'A' artifact, 'E' exit, 'o' coin.
// Guards are listed separately: spawn tile + patrol waypoints in tiles.

export const LEVELS = [
  {
    name: 'Level 1 — The Atrium',
    tip: 'Stay out of the yellow cones. Crouch behind crates, hide in the bushes.',
    map: [
      '################################',
      '#P.....#......S.......#.......A#',
      '#......#.............#....o....#',
      '#..C...#...C.....C...#.........#',
      '#......#.............#....#....#',
      '#..S.......C.........#....#.E..#',
      '#......#.............#....#....#',
      '######...######..#####....#....#',
      '#.........S.....#....C....#....#',
      '#..A......#.....#.........#....#',
      '#....C....#..C..#....S....#....#',
      '#.........#.....#..............#',
      '#..S......#.....#.......C......#',
      '#.........#.....#....A....S....#',
      '#....C....#.....#..............#',
      '#.........#.....#.....o........#',
      '################################',
    ],
    guards: [
      { spawn: [10, 5], path: [[10, 5], [10, 8], [17, 8], [17, 5]] },
      { spawn: [24, 3], path: [[24, 3], [24, 10], [29, 10], [29, 3]] },
      { spawn: [5, 13], path: [[5, 13], [5, 9], [14, 9], [14, 13]] },
    ],
  },
  {
    name: 'Level 2 — The Gallery',
    tip: 'Sneak (hold Shift) to move quietly. Running feet are heard.',
    map: [
      '################################',
      '#P...S......#.........C........#',
      '#..........#...................#',
      '#..C...A...#....S......C....A..#',
      '#..........#...................#',
      '#####..#####..######..######..##',
      '#......C.....#....S....#.......#',
      '#............#.........#...o...#',
      '#..S....C....#....C....#.......#',
      '#............#.........#.......#',
      '#####..#######....######...#####',
      '#.......S.....C...........C....#',
      '#..o.........C.....S...........#',
      '#..........#......C......A.....#',
      '#....C.....#..........C........#',
      '#......S...#....o..........E...#',
      '################################',
    ],
    guards: [
      { spawn: [7, 2], path: [[7, 2], [7, 8], [14, 8], [14, 2]] },
      { spawn: [20, 2], path: [[20, 2], [20, 8], [27, 8], [27, 2]] },
      { spawn: [6, 13], path: [[6, 13], [13, 13], [13, 15], [6, 15]] },
      { spawn: [22, 12], path: [[22, 12], [22, 15], [28, 15], [28, 12]] },
    ],
  },
  {
    name: 'Level 3 — The Vault',
    tip: 'The vault guards never rest. Use the shadows — they cannot see you there.',
    map: [
      '################################',
      '#P....#...S....#......C....A...#',
      '#.....#........#...............#',
      '#..C..#...C....#..S......C.....#',
      '#.....#........#...............#',
      '######..#######..######..#######',
      '#....S.....#..........#....o...#',
      '#....C.....#....C.....#........#',
      '#..........#..........#....C...#',
      '#..A.......#....S.....#........#',
      '######..#######..######....#####',
      '#.....C......#......S......C...#',
      '#............#.................#',
      '#..S....A....#...C......C......#',
      '#............#.................#',
      '#.....o......#.....S........E..#',
      '################################',
    ],
    guards: [
      { spawn: [8, 2], path: [[8, 2], [8, 4], [13, 4], [13, 2]] },
      { spawn: [21, 2], path: [[21, 2], [21, 4], [28, 4], [28, 2]] },
      { spawn: [5, 8], path: [[5, 8], [12, 8], [12, 13], [5, 13]] },
      { spawn: [19, 8], path: [[19, 8], [19, 13], [26, 13], [26, 8]] },
      { spawn: [15, 10], path: [[15, 8], [16, 8], [16, 10], [15, 10]] },
    ],
  },
];

/** Parse one level's map into walls, crates, shadows, spawn, artifacts, exit, coins. */
export function parseLevel(level) {
  const walls = new Set();
  const crates = new Set();
  const shadows = new Set();
  let player = { x: 1, y: 1 };
  let exit = { x: 30, y: 15 };
  const artifacts = [];
  const coins = [];
  const names = ['Sun Disk', 'Jade Fox', 'Clockwork Heart'];
  let artifactIndex = 0;
  level.map.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      const key = `${x},${y}`;
      if (ch === '#') walls.add(key);
      else if (ch === 'C') crates.add(key);
      else if (ch === 'S') shadows.add(key);
      else if (ch === 'P') player = { x, y };
      else if (ch === 'E') exit = { x, y };
      else if (ch === 'A') {
        artifacts.push({ x, y, name: names[artifactIndex % names.length], taken: false });
        artifactIndex++;
      } else if (ch === 'o') coins.push({ x, y, taken: false });
    }
  });
  return { walls, crates, shadows, player, exit, artifacts, coins };
}
