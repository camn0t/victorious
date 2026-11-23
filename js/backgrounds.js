// Procedural backdrops (2048x1024 canvases). Add a preset = add an entry.
import { r } from './util.js';

const pick = a => a[Math.random() * a.length | 0];
export const BACKGROUNDS = {
  'Graffiti (red & teal)': { base: '#111', pal: ['#d9262b', '#2a9d9a', '#1d2a6b', '#c2185b', '#f28c28', '#3aa0d8', '#7a1fa2', '#e8e8e8', '#111'] },
  'Graffiti (pink & lime)': { base: '#12030e', pal: ['#b8106e', '#d81b85', '#ff5fb6', '#8e0c58', '#d9ff1f', '#c6f000', '#1a0a14', '#f2f2f2'] },
  'Purple night': { base: '#0a0618', pal: ['#3b1d8f', '#6a2bd9', '#1d2a6b', '#2a9d9a', '#c2185b', '#0d0d20', '#9b7bff', '#e8e8e8'] },
  'Sunset': { base: '#2a0f05', pal: ['#f28c28', '#ffd21f', '#d9262b', '#3aa0d8', '#1d2a6b', '#ff6f3c', '#fff1c1', '#111'] },
  'Brick wall': { base: '#6e5546', pal: ['#ffd21f', '#2a6fd6', '#d9262b', '#2ea84a', '#f28c28', '#2ad1d1'], bricks: true },
};

export function makeBackground(name) {
  const { base, pal, bricks } = BACKGROUNDS[name], cv = document.createElement('canvas');
  cv.width = 2048; cv.height = 1024;
  const g = cv.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 2048, 1024); g.lineCap = 'round';

  if (bricks) {
    for (let y = 0, row = 0; y < 1024; y += 52, row++)
      for (let x = row % 2 ? -60 : 0; x < 2048; x += 122) { g.fillStyle = `hsl(${r(8, 24)} ${r(45, 65)}% ${r(32, 48)}%)`; g.fillRect(x + 3, y + 3, 116, 46); }
    g.lineJoin = 'miter';
    for (let i = 0; i < 14; i++) { // zig-zag paint stripes, outlined like spray paint
      const pts = []; let x = r(-200, 2048), y = r(0, 1024);
      for (let k = 0; k < 6; k++) { pts.push([x, y]); x += r(120, 260); y += r(-220, 220); }
      const w = r(40, 90), line = () => { g.beginPath(); g.moveTo(...pts[0]); pts.slice(1).forEach(p => g.lineTo(...p)); };
      line(); g.strokeStyle = '#000'; g.lineWidth = w + 16; g.stroke();
      line(); g.strokeStyle = '#fff'; g.lineWidth = w + 6; g.stroke();
      line(); g.strokeStyle = pick(pal); g.lineWidth = w; g.stroke();
    }
  } else {
    g.lineJoin = 'round';
    for (let i = 0; i < 160; i++) { // smooth random blobs, black + white outlines
      const x = r(0, 2048), y = r(0, 1024), rad = r(50, 220), n = 5 + (Math.random() * 3 | 0), pts = [];
      for (let k = 0; k < n; k++) { const a = k / n * 6.28 + r(-.3, .3), d = rad * r(.4, 1); pts.push([x + Math.cos(a) * d, y + Math.sin(a) * d]); }
      const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      g.beginPath(); g.moveTo(...mid(pts[n - 1], pts[0]));
      pts.forEach((p, k) => g.quadraticCurveTo(...p, ...mid(p, pts[(k + 1) % n])));
      g.fillStyle = pick(pal); g.fill();
      g.strokeStyle = '#000'; g.lineWidth = 12; g.stroke(); g.strokeStyle = '#fff'; g.lineWidth = 4; g.stroke();
    }
  }
  g.filter = 'blur(3px)'; g.drawImage(cv, 0, 0); g.filter = 'none';
  return cv;
}
