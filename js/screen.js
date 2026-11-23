// 2D drawing of the phone's screen (SVG coords; the portrait UI is the same canvas rotated)
import { layers, X0, X1, Y0, Y1 } from './phone.js';
import { glyphs, loadApple } from './util.js';

export const photo = new Image();
export let emojiVer = 0; // bumps when an emoji image arrives, so the screen redraws

const NAME = px => `bold ${px}px "Copperplate Gothic Bold","Copperplate","Russo One",sans-serif`;
const EMOJI = px => `${px}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
let c;
const L = i => { c = layers[i].ctx; };

const emojiCache = new Map();
// draws one or more emoji in a row ending at x + size/2 (a single one is centred on x); returns the row's left edge
function emoji(s, x, cy, size) {
  let right = x + size / 2;
  for (const g of glyphs(s).reverse()) {
    if (!emojiCache.has(g)) { const img = new Image(); img.crossOrigin = 'anonymous'; img.onload = () => emojiVer++; loadApple(img, g); emojiCache.set(g, img); }
    const img = emojiCache.get(g), cx = right - size / 2;
    if (img.complete && img.naturalWidth) c.drawImage(img, cx - size / 2, cy - size / 2, size, size);
    else txt(g, cx, cy + size * .35, EMOJI(size), '#000', 0, 'center');
    right -= size * 1.05;
  }
  return right;
}
const lift = fn => { c.save(); c.shadowColor = '#000a'; c.shadowBlur = 28; c.shadowOffsetY = 12; fn(); c.restore(); };
function box(x, y, w, h, rad, fill, stroke, lw) { c.beginPath(); c.roundRect(x, y, w, h, rad); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); } }
function txt(s, x, y, font, color, max, align = 'left') { c.font = font; c.fillStyle = color; c.textAlign = align; max ? c.fillText(s, x, y, max) : c.fillText(s, x, y); }
function wrap(text, maxW) {
  const lines = [];
  for (const para of text.split('\n')) {
    let line = '';
    for (const w of para.split(' ')) { const t = line ? line + ' ' + w : w; if (c.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
    lines.push(line);
  }
  return lines;
}
// fits text into a box, shrinking the font; shows only the first `chars` characters (typing)
function para(text, x, y, w, h, size, chars = Infinity, cursor = false) {
  let lines; do { c.font = `bold ${size}px Arial`; lines = wrap(text, w); } while (lines.length * size * 1.2 > h && --size > 10);
  c.fillStyle = '#111'; c.textAlign = 'left';
  let left = chars, last = [x, y];
  lines.forEach((l, i) => { if (left <= 0) return; const s = l.slice(0, left), ly = y + i * size * 1.2; c.fillText(s, x, ly); last = [x + c.measureText(s).width, ly]; left -= l.length + 1; });
  if (cursor) c.fillRect(last[0] + 2, last[1] - size * .85, 2, size);
}
function face(x, y, w, h) {
  c.save(); c.beginPath(); c.roundRect(x, y, w, h, 4); c.clip();
  if (photo.naturalWidth) {
    const k = Math.max(w / photo.naturalWidth, h / photo.naturalHeight);
    c.drawImage(photo, x + (w - photo.naturalWidth * k) / 2, y + (h - photo.naturalHeight * k) / 2, photo.naturalWidth * k, photo.naturalHeight * k);
  } else {
    c.fillStyle = '#5a3a2a'; c.fillRect(x, y, w, h); c.fillStyle = '#f0c6a4';
    c.beginPath(); c.arc(x + w / 2, y + h * .42, w * .2, 0, 7); c.ellipse(x + w / 2, y + h * 1.05, w * .4, h * .35, 0, 0, 7); c.fill();
  }
  c.restore();
}
function logo(x, y, s) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.arc(-88, -10, 22, 0, 7); c.fillStyle = '#fff'; c.fill();
  emoji('✋', -88, -10, 30);
  const gr = c.createLinearGradient(0, -34, 0, 4); gr.addColorStop(0, '#ffe066'); gr.addColorStop(1, '#f7931e');
  c.font = 'italic 900 36px "Arial Black",Arial'; c.textAlign = 'left'; c.lineJoin = 'round';
  c.lineWidth = 7; c.strokeStyle = '#6b2a00'; c.strokeText('TheSlap', -62, 0); c.lineWidth = 3; c.strokeStyle = '#fff'; c.strokeText('TheSlap', -62, 0);
  c.fillStyle = gr; c.fillText('TheSlap', -62, 0);
  c.font = 'bold 20px Arial'; c.fillStyle = '#fff'; c.fillText('.com', 92, 0);
  c.restore();
}
// glossy vector icons (drawn in a 24-unit box centred on 0,0)
const grad = (a, b, y0 = -12, y1 = 12) => { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; };
function mail() {
  c.fillStyle = grad('#ffffff', '#aeb5bd', -8, 8); c.strokeStyle = '#4a4f57'; c.lineWidth = 1;
  c.beginPath(); c.rect(-12, -8, 24, 16); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-12, -8); c.lineTo(0, 2); c.lineTo(12, -8); c.moveTo(-12, 8); c.lineTo(-3, 0); c.moveTo(12, 8); c.lineTo(3, 0); c.stroke();
}
function camera() {
  c.fillStyle = grad('#f2f2f2', '#7d838b', -10, 9);
  c.beginPath(); c.roundRect(-7, -11, 8, 4, 1.5); c.roundRect(-12, -8, 24, 17, 3); c.fill();
  c.fillStyle = '#2a2d33'; c.beginPath(); c.arc(0, .5, 6.5, 0, 7); c.fill();
  c.fillStyle = grad('#ffffff', '#8f9aa6', -4, 5); c.beginPath(); c.arc(0, .5, 4.5, 0, 7); c.fill();
  c.fillStyle = '#2a2d33'; c.beginPath(); c.arc(0, .5, 2.2, 0, 7); c.fill();
}
function house() {
  c.fillStyle = grad('#9ff6ff', '#0f9fca'); c.strokeStyle = '#0b5c78'; c.lineWidth = .8;
  c.beginPath(); c.moveTo(-13, -1); c.lineTo(0, -12); c.lineTo(13, -1); c.lineTo(9, -1); c.lineTo(9, 11); c.lineTo(-9, 11); c.lineTo(-9, -1); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = '#0d2a3a'; c.fillRect(-2.5, 3, 5, 8);
}
function friends() {
  c.fillStyle = grad('#ffffff', '#8d939b', -10, 11);
  [[-10, .72], [-3.5, .82], [3, .92], [9.5, 1]].forEach(([x, h]) => {
    c.beginPath(); c.arc(x, 11 - 13 * h, 2.6 * h, 0, 7); c.roundRect(x - 2.6 * h, 11 - 9.5 * h, 5.2 * h, 9.5 * h, [2.5 * h, 2.5 * h, 0, 0]); c.fill();
  });
}
function icon(draw, label, x, y, size = 26) {
  c.save(); c.translate(x, y - size * .45); c.scale(size / 26, size / 26); c.shadowColor = '#0008'; c.shadowBlur = 3; c.shadowOffsetY = 1; draw(); c.restore();
  txt(label, x, y + size * .7, 'bold 11px Arial', '#e6e6e6', 0, 'center');
}

function screenBG() {
  const gr = c.createLinearGradient(0, Y0, 0, Y1);
  gr.addColorStop(0, '#1f6b45'); gr.addColorStop(.4, '#173a50'); gr.addColorStop(.65, '#111a45'); gr.addColorStop(1, '#090b28');
  c.fillStyle = gr; c.fillRect(X0, Y0, X1 - X0, Y1 - Y0);
  c.lineWidth = 14; c.globalAlpha = .5;
  [['#0c3a26', 0], ['#2f8f5a', 40], ['#0c3a26', 80]].forEach(([col, d]) => { c.strokeStyle = col; c.beginPath(); c.moveTo(250 + d, 340); c.bezierCurveTo(300 + d, 150 + d, 700 - d, 120 + d, 820 - d, 300); c.stroke(); });
  c.globalAlpha = 1; c.fillStyle = '#ffe9a8';
  [[180, 480, 9], [150, 535, 6], [250, 520, 3], [330, 500, 2], [420, 540, 2], [850, 510, 2]].forEach(([x, y, s]) => { c.beginPath(); c.arc(x, y, s / 2, 0, 7); c.fill(); });
}

function landscape(S) {
  L(3);
  logo(640, 135, 1);
  box(134, 292, 40, 124, 10, '#140f38dd', '#e6177a', 3); icon(mail, 'Mail', 154, 330, 22); icon(camera, 'Photos', 154, 383, 22);
  box(585, 474, 185, 66, 10, '#0d0f2acc', '#e6177a', 3); icon(house, 'Home', 630, 505, 26); icon(friends, 'Friends', 720, 505, 26);
  lift(() => box(176, 262, 152, 192, 8, '#ec1e86')); face(184, 270, 136, 142); txt('UPDATE', 252, 442, NAME(24), '#ffd21f', 140, 'center');
  L(4);
  const gr = c.createLinearGradient(0, 165, 0, 465); gr.addColorStop(0, '#fff'); gr.addColorStop(.75, '#e6f4ff');
  lift(() => box(332, 165, 460, 300, 10, gr)); box(332, 165, 460, 300, 10, null, '#e6177a', 4);
  txt(S.name.toUpperCase() + ':', 350, 205, NAME(30), '#2b1fc4', 420);
  para(S.status, 350, 245, 425, 150, 26);
  box(334, 407, 456, 56, [0, 0, 8, 8], '#a9dcff');
  txt('FEELING:', 350, 445, NAME(24), '#e0102f'); const fx = 350 + c.measureText('FEELING:').width + 6;
  const ex = emoji(S.emoji, 764, 435, 38); txt(S.mood, fx, 445, 'bold 28px Arial', '#6b2bd9', ex - fx - 4);
}

const KEYS = [...'😀😃😄😊😉😍😎😜😐😒😢😭😠😲😴'];
function portrait(S) {
  const P = () => { c.translate(X0, Y1); c.rotate(-Math.PI / 2); }; // portrait coords: 0..(Y1-Y0) wide, 0..(X1-X0) tall
  L(1); c.save(); P();
  box(165, 70, 150, 62, 10, '#0d0f2acc'); icon(camera, 'Photos', 205, 98, 24); icon(mail, 'Mail', 275, 98, 24);
  lift(() => box(130, 142, 210, 140, 6, '#ec1e86'));
  c.save(); c.translate(158, 212); c.rotate(-Math.PI / 2); txt('UPDATE', 0, 8, NAME(22), '#ffd21f', 130, 'center'); c.restore();
  face(176, 146, 160, 132);
  // black emoji keyboard: POST | 8-over-7 staggered keys | CLOSE; the key under the "finger" pops while typing
  // (all portrait boxes are sized to stay inside the visible screen, clear of the bezel)
  box(96, 626, 320, 52, 8, '#050308', '#3a1a4a', 2);
  box(102, 637, 62, 28, 8, '#4a2a5e'); txt('POST', 133, 657, NAME(15), '#fff', 0, 'center');
  box(348, 637, 62, 28, 8, '#4a2a5e'); txt('CLOSE', 379, 657, NAME(14), '#fff', 0, 'center');
  KEYS.forEach((k, i) => {
    const row = i < 8 ? 0 : 1, x = 172 + (row ? i - 8 + .5 : i) * 21, y = 641 + row * 22, hit = S.typing && S.typed > 0 && S.typed % 15 === i;
    emoji(k, x, y, hit ? 24 : 18);
  });
  box(44, 390, 52, 150, 10, '#0d0f2acc'); icon(house, 'Home', 70, 432, 24); icon(friends, 'Friends', 70, 500, 22);
  c.restore();
  L(2); c.save(); P();
  const gr = c.createLinearGradient(0, 334, 0, 630); gr.addColorStop(0, '#fff'); gr.addColorStop(.8, '#e1f1ff'); gr.addColorStop(1, '#a9dcff');
  lift(() => box(100, 334, 320, 294, 6, gr)); box(100, 334, 320, 294, 6, null, '#7b2fd0', 4);
  lift(() => box(92, 290, 304, 38, 4, '#f4f2ff')); box(92, 290, 304, 38, 4, null, '#6a2bd9', 2); txt(S.name.toUpperCase() + ':', 106, 318, NAME(26), '#2b1fc4', 280);
  txt(S.name.toUpperCase() + ':', 114, 362, NAME(20), '#2b1fc4', 292);
  if (S.updating) {
    box(122, 440, 276, 58, 8, '#8d939c', '#4a4f57', 3);
    txt('UPDATING' + '.'.repeat(S.dots), 152, 480, NAME(28), '#f2f2f2', 236);
  } else para(S.status, 114, 390, 292, 170, 21, S.typed, S.blink);
  txt('FEELING:', 114, 612, NAME(18), '#e0102f'); const fx = 114 + c.measureText('FEELING:').width + 5;
  if (!S.updating) { const ex = S.showEmoji ? emoji(S.emoji, 400, 605, 26) : 412; txt(S.moodTyped, fx, 612, 'bold 20px Arial', '#6b2bd9', ex - fx - 4); }
  c.restore();
}

function prep(ctx) {
  const k = ctx.canvas.width / (X1 - X0);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.setTransform(k, 0, 0, k, -X0 * k, -Y0 * k);
}
prep(layers[0].ctx); L(0); screenBG(); layers[0].tex.needsUpdate = true; // static, drawn once

// Redraws each orientation only when its content changes; f = 0 portrait … 1 landscape (a GPU opacity fade)
let pKey = '', lKey = '';
document.fonts.addEventListener('loadingdone', () => lKey = pKey = null); // web fonts arrive after the first draw: redraw with them
export function updateScreen(S, f) {
  const redraw = (from, draw) => { prep(layers[from].ctx); prep(layers[from + 1].ctx); draw(S); layers[from].tex.needsUpdate = layers[from + 1].tex.needsUpdate = true; };
  const lk = JSON.stringify([S.name, S.status, S.mood, S.emoji, S.photo, S.ev]);
  if (lk !== lKey) { lKey = lk; redraw(3, landscape); }
  if (f < 1) { const pk = JSON.stringify(S); if (pk !== pKey) { pKey = pk; redraw(1, portrait); } }
  layers.slice(1).forEach((l, i) => { l.m.material.opacity = i < 2 ? 1 - f : f; l.m.visible = l.m.material.opacity > 0; });
}
