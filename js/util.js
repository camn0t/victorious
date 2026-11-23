export const $ = id => document.getElementById(id);
export const clamp = x => Math.min(Math.max(x, 0), 1);
export const smooth = x => (x = clamp(x), x * x * (3 - 2 * x));
export const r = (a, b) => a + Math.random() * (b - a);

const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
export const glyphs = s => [...seg.segment(s)].map(g => g.segment).filter(g => g.trim());

// Apple emoji images (emoji-datasource-apple); tries the filename with/without the FE0F variation selector
const APPLE = 'https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.2/img/apple/64/';
export function loadApple(img, s) {
  const code = [...s].map(ch => ch.codePointAt(0).toString(16)).join('-');
  const tries = [...new Set([code, code.replace(/-fe0f/g, ''), code + '-fe0f'])];
  img.onerror = () => { if (tries.length) img.src = APPLE + tries.shift() + '.png'; };
  img.onerror();
}

// a field's text, or its placeholder (the sample) while it's empty
export const val = id => $(id).value || $(id).placeholder;
