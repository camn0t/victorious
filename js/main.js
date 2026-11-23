// Timeline, camera/phone animation, render loop and video export
import { $, clamp, smooth, val } from './util.js';
import { Muxer, ArrayBufferTarget } from 'https://cdn.jsdelivr.net/npm/mp4-muxer@5.1.3/build/mp4-muxer.mjs';
import { renderer, scene, cam, phone, bg, W, H } from './phone.js';
import { photo, emojiVer, updateScreen } from './screen.js';
import './ui.js';

// Cue times in seconds; typing speed stretches to fit its window.
//   fly: phone has landed · typeS→typeE: status types · moodS→moodE: feeling types · emoji: emoji appears
//   upd: UPDATING bar · rotS→rotE: swing to landscape · end: rush into the screen finishes
const CUE = { fly: .9, typeS: 1.2, typeE: 2.8, moodS: 3.0, moodE: 3.6, emoji: 3.8, upd: 4.2, rotS: 4.8, rotE: 5.9, end: 10.4 };
const plan = () => ({ ...CUE,
  cps: val('status').length / (CUE.typeE - CUE.typeS), // characters per second
  mps: val('mood').length / (CUE.moodE - CUE.moodS) });

function frame(t, T) {
  const S = {
    name: val('name'), status: val('status'), mood: val('mood'), emoji: val('emoji'),
    typed: Math.floor((t - T.typeS) * T.cps), typing: t < T.typeE + .2,
    moodTyped: val('mood').slice(0, Math.max(0, Math.floor((t - T.moodS) * T.mps))), showEmoji: t > T.emoji, updating: t > T.upd,
    blink: t < T.typeE + .2 && t % .6 < .3, dots: t < T.rotS ? Math.floor(t / .3) % 4 : 3,
    photo: photo.naturalWidth && photo.src, ev: emojiVer,
  };
  const fly = smooth(t / T.fly), rot = smooth((t - T.rotS) / (T.rotE - T.rotS)), hold = clamp((t - T.rotE) / (T.end - T.rotE)), out = clamp((t - (T.end - .45)) / .45) ** 2;

  updateScreen(S, smooth((rot - .4) / .25)); // portrait → landscape mid-swing

  // entrance: back-first from far away, 1.5 tumbling turns, whips close past the lens, settles upright;
  // on update it leans back and swings sideways, then drifts
  phone.rotation.set(
    -.35 + .2 * rot - .55 * Math.sin(Math.PI * rot) + .06 * Math.sin(t * .8) - 1.1 * Math.sin(Math.PI * fly) * (1 - fly),
    (1 - fly) * Math.PI * 3 + .18 * Math.sin(t * .5 + 1) - .12 * rot,
    -Math.PI / 2 * (1 - rot) + (1 - fly) * .9);
  phone.position.set(.6 * (1 - fly), -.05, -25 * (1 - fly) ** 2 + 3.8 * Math.sin(Math.PI * fly));

  // camera: slow push-in on the hold, then a rush into the screen
  cam.position.set(.25 * Math.sin(t * .3), .1, 5.1 - .45 * rot - .3 * hold - 3.6 * out); // keeps the whole phone in frame
  cam.lookAt(0, 0, 0);
  bg.position.x = -.25 * t;
  renderer.render(scene, cam);
}

let start = performance.now(), T = plan(), exporting = false;
const restart = () => { T = plan(); start = performance.now(); };
renderer.setAnimationLoop(now => {
  if (exporting) return; // the exporter drives frames itself
  let t = (now - start) / 1000;
  if (t > T.end) { restart(); t = 0; }
  frame(t, T);
});
$('replay').onclick = restart;

// Export: renders every frame at its exact time and encodes it (WebCodecs) — no real-time capture, so no dropped frames.
const FPS = 30;
async function exportVideo() {
  const T = plan(), n = Math.ceil(T.end * FPS);
  const vcfg = ['avc1.640028', 'avc1.4d0028', 'avc1.42001f'].map(codec => ({ codec, width: W, height: H, bitrate: 12e6, framerate: FPS }));
  const vc = await (async () => { for (const c of vcfg) if ((await VideoEncoder.isConfigSupported(c)).supported) return c; })();
  if (!vc) throw new Error('This browser cannot encode H.264 video.');
  const muxer = new Muxer({ target: new ArrayBufferTarget(), fastStart: 'in-memory', video: { codec: 'avc', width: W, height: H, frameRate: FPS } });
  let failed = null;
  const ve = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: e => failed = e });
  ve.configure(vc);
  for (let i = 0; i < n && !failed; i++) {
    frame(i / FPS, T);
    const vf = new VideoFrame(renderer.domElement, { timestamp: Math.round(i * 1e6 / FPS), duration: Math.round(1e6 / FPS) });
    ve.encode(vf, { keyFrame: i % (FPS * 2) === 0 }); vf.close();
    if (ve.encodeQueueSize > 8) await new Promise(r => ve.addEventListener('dequeue', r, { once: true }));
    if (i % 10 === 0) { $('rec').textContent = `Rendering… ${Math.round(i / n * 100)}%`; await new Promise(requestAnimationFrame); }
  }
  await ve.flush();
  if (failed) throw failed;

  muxer.finalize();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([muxer.target.buffer], { type: 'video/mp4' }));
  a.download = 'theslap-status.mp4'; a.click();
}
$('rec').onclick = async () => {
  exporting = true; $('rec').disabled = true;
  try { await exportVideo(); } catch (e) { alert('Export failed: ' + e.message); console.error(e); }
  exporting = false; $('rec').disabled = false; $('rec').textContent = 'Download video'; restart();
};
document.fonts.load('30px "Russo One"');
