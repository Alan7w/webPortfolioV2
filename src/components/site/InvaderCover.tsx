/**
 * Projects without a screenshot get a cover generated from their name: a mirrored
 * 11×8 "space invader" sprite on a starfield. Deterministic, so it never changes between builds.
 */

function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COLS = 11;
const ROWS = 8;

function sprite(seed: string): boolean[][] {
  const rand = mulberry32(hash(seed));
  for (let attempt = 0; attempt < 8; attempt++) {
    const grid: boolean[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(false));
    let count = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < Math.ceil(COLS / 2); c++) {
        // Denser toward the middle so it reads as a body, sparser at the edges for "legs/arms".
        const centerBias = 1 - Math.abs(c - 5) / 7;
        const rowBias = r === 0 || r === ROWS - 1 ? 0.35 : 0.6;
        const on = rand() < centerBias * rowBias + 0.12;
        grid[r][c] = on;
        grid[r][COLS - 1 - c] = on;
        if (on) count += c === 5 ? 1 : 2;
      }
    }
    // Eyes: always punch two holes for character.
    const eyeRow = 2 + Math.floor(rand() * 2);
    const eyeCol = 3 + Math.floor(rand() * 2);
    grid[eyeRow][eyeCol] = false;
    grid[eyeRow][COLS - 1 - eyeCol] = false;
    if (count >= 30 && count <= 62) return grid;
  }
  return Array.from({ length: ROWS }, (_, r) => Array.from({ length: COLS }, (_, c) => (r + c) % 2 === 0));
}

export function InvaderCover({ seed, className }: { seed: string; className?: string }) {
  const grid = sprite(seed);
  const rand = mulberry32(hash(seed + "*stars"));
  const stars = Array.from({ length: 22 }, () => ({ x: rand() * 400, y: rand() * 250, s: rand() < 0.2 ? 3 : 2, o: 0.25 + rand() * 0.5 }));
  const cell = 11;
  const ox = (400 - COLS * cell) / 2;
  const oy = (250 - ROWS * cell) / 2 - 6;
  return (
    <svg viewBox="0 0 400 250" className={className} role="img" aria-hidden preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="250" fill="var(--accent-soft)" />
      <g opacity="0.5">
        {Array.from({ length: 21 }, (_, i) => (
          <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="250" stroke="var(--line)" strokeWidth="1" />
        ))}
        {Array.from({ length: 13 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 20} x2="400" y2={i * 20} stroke="var(--line)" strokeWidth="1" />
        ))}
      </g>
      {stars.map((star, i) => (
        <rect key={i} x={star.x} y={star.y} width={star.s} height={star.s} fill="var(--accent)" opacity={star.o} />
      ))}
      <g>
        {grid.flatMap((row, r) =>
          row.map((on, c) =>
            on ? <rect key={`${r}-${c}`} x={ox + c * cell} y={oy + r * cell} width={cell} height={cell} fill="var(--accent)" /> : null,
          ),
        )}
      </g>
      <rect x={ox - 10} y={oy + ROWS * cell + 22} width={COLS * cell + 20} height="4" fill="var(--accent)" opacity="0.35" />
    </svg>
  );
}
