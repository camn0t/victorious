// Form wiring: photo cropper, emoji picker, phone colour, backgrounds
import 'https://cdn.jsdelivr.net/npm/emoji-picker-element@1.28.1/index.js';
import { $, glyphs, loadApple, val } from './util.js';
import { colorMat, setBg } from './phone.js';
import { photo } from './screen.js';
import { BACKGROUNDS, makeBackground } from './backgrounds.js';

// photo cropper: square crop, drag to pan, wheel/slider to zoom (about the centre)
const raw = new Image(), cc = $('cropcv'), cg = cc.getContext('2d'), CS = cc.width;
let ox = 0, oy = 0, zoom = 1;
const scale = () => Math.max(CS / raw.naturalWidth, CS / raw.naturalHeight) * zoom;
function drawCrop() {
  const k = scale(), w = raw.naturalWidth * k, h = raw.naturalHeight * k;
  ox = Math.min(0, Math.max(CS - w, ox)); oy = Math.min(0, Math.max(CS - h, oy)); // never show empty edges
  cg.clearRect(0, 0, CS, CS); cg.drawImage(raw, ox, oy, w, h);
}
function setZoom(z) {
  const k0 = scale(); zoom = Math.min(5, Math.max(1, z)); const k1 = scale();
  ox = CS / 2 - (CS / 2 - ox) * k1 / k0; oy = CS / 2 - (CS / 2 - oy) * k1 / k0;
  $('zoom').value = zoom; drawCrop();
}
$('photo').onchange = e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  raw.onload = () => { zoom = 1; $('zoom').value = 1; ox = oy = -1e9; drawCrop(); ox /= 2; oy /= 2; drawCrop(); $('crop').showModal(); }; // centred
  raw.src = URL.createObjectURL(f);
};
cc.onpointerdown = e => { cc.setPointerCapture(e.pointerId); cc.style.cursor = 'grabbing'; };
cc.onpointerup = () => cc.style.cursor = 'grab';
cc.onpointermove = e => { if (!cc.hasPointerCapture(e.pointerId)) return; const s = CS / cc.clientWidth; ox += e.movementX * s; oy += e.movementY * s; drawCrop(); };
cc.onwheel = e => { e.preventDefault(); setZoom(zoom * Math.exp(-e.deltaY * .0015)); };
$('zoom').oninput = e => setZoom(+e.target.value);
$('cropCancel').onclick = () => $('crop').close();
$('cropOk').onclick = () => cc.toBlob(b => { photo.src = URL.createObjectURL(b); $('crop').close(); });

colorMat.color.setStyle(`hsl(${Math.random() * 360 | 0}, 100%, 55%)`); $('color').value = '#' + colorMat.color.getHexString(); // random neon each load
$('color').oninput = e => colorMat.color.set(e.target.value);

// the first emoji after opening the picker (or clicking the box) replaces what's there; later ones add on. The video always draws Apple emoji.
const prev = () => loadApple($('emojiPrev'), glyphs(val('emoji'))[0] || '🙂');
$('emoji').oninput = prev; prev();
$('emoji').onfocus = e => e.target.select(); // typing replaces what's there
let fresh = true;
$('picker').addEventListener('beforetoggle', e => { if (e.newState === 'open') fresh = true; });
document.querySelector('emoji-picker').addEventListener('emoji-click', e => { $('emoji').value = (fresh ? '' : $('emoji').value) + e.detail.unicode; fresh = false; prev(); });

// backgrounds: presets, or the user's own image
for (const name of Object.keys(BACKGROUNDS)) $('bgsel').add(new Option(name));
$('bgsel').onchange = () => setBg(makeBackground($('bgsel').value));
$('bgsel').onchange();
$('bgfile').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const img = new Image(); img.onload = () => setBg(img); img.src = URL.createObjectURL(f);
};
