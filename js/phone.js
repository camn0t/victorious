// Renderer, scene, camera, the 3D pear phone and the backdrop plane
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { $ } from './util.js';

export const W = 1280, H = 720;
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(W, H, false); renderer.setPixelRatio(1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
$('view').append(renderer.domElement);
export const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), .04).texture;
export const cam = new THREE.PerspectiveCamera(35, W / H, .1, 100);
const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 5, 6); scene.add(key, new THREE.AmbientLight(0xffffff, .4));

// pear outline (SVG-style coords, 1000x620 box), turned into THREE shapes
const SEG = [[20,260,90,200,200,185],[330,165,420,60,600,40],[800,20,960,120,970,330],[980,520,860,610,650,600],[470,590,380,520,220,500],[100,490,80,420,60,340]];
const SCR = [.86, 470, 330]; // screen = outline scaled .86 about (470,330): thicker rim on the button side
function pear(s = 1, cx = 500, cy = 330) {
  const m = (x, y) => [(cx + (x - cx) * s - 500) / 250, -(cy + (y - cy) * s - 330) / 250], sh = new THREE.Shape();
  sh.moveTo(...m(60, 340));
  for (const c of SEG) sh.bezierCurveTo(...m(c[0], c[1]), ...m(c[2], c[3]), ...m(c[4], c[5]));
  return sh;
}

export const phone = new THREE.Group(); scene.add(phone);
export const colorMat = new THREE.MeshPhysicalMaterial({ color: $('color').value, roughness: .3, clearcoat: 1, clearcoatRoughness: .05, toneMapped: false }); // no tone mapping: keeps neon colours neon
const chrome = new THREE.MeshStandardMaterial({ color: 0xe8ecf0, metalness: 1, roughness: .12 });
const black = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: .6 });
const EX = { curveSegments: 96 };
// side band, front rim with the screen hole, colored back plate
const body = new THREE.Mesh(new THREE.ExtrudeGeometry(pear(.975), { ...EX, depth: .34, bevelThickness: .02, bevelSize: .02, bevelSegments: 4 }), colorMat);
body.position.z = -.17;
const rim = pear(); rim.holes.push(pear(...SCR));
const front = new THREE.Mesh(new THREE.ExtrudeGeometry(rim, { ...EX, depth: .02, bevelThickness: .08, bevelSize: .06, bevelSegments: 10 }), colorMat);
const back = new THREE.Mesh(new THREE.ExtrudeGeometry(pear(), { ...EX, depth: .02, bevelThickness: .08, bevelSize: .06, bevelSegments: 10 }), colorMat);
front.position.z = .17; back.position.z = -.19;
// headphone jack at the narrow tip, rocker button on the top edge
const jack = new THREE.Mesh(new THREE.CylinderGeometry(.055, .055, .1, 24), black);
jack.rotation.z = Math.PI / 2; jack.position.set(-1.70, -.04, 0);
const rocker = new THREE.Mesh(new THREE.CapsuleGeometry(.04, .4, 6, 12), chrome);
rocker.rotation.z = Math.PI / 2 - .08; rocker.position.set(.25, 1.15, 0);
phone.add(body, front, back, jack, rocker);

// screen: layers clipped to the pear (UVs = bbox)
const screenGeo = new THREE.ShapeGeometry(pear(...SCR), 96);
screenGeo.computeBoundingBox();
const bb = screenGeo.boundingBox, uv = screenGeo.attributes.uv, pos = screenGeo.attributes.position;
for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) - bb.min.x) / (bb.max.x - bb.min.x), (pos.getY(i) - bb.min.y) / (bb.max.y - bb.min.y));
// screen bbox in SVG coords (what the 2D screen drawing uses)
export const X0 = bb.min.x * 250 + 500, X1 = bb.max.x * 250 + 500, Y0 = 330 - bb.max.y * 250, Y1 = 330 - bb.min.y * 250;
// 0 = screen bg; 1,2 = portrait panels/card; 3,4 = landscape panels/card (crossfaded on the GPU, never redrawn mid-swing).
// Portrait lies flat on the screen (cut to its shape, under the bezel); landscape floats above the rim top (z .27) so it pops out without cutting into it.
export const layers = [.2, .201, .202, .287, .317].map((z, i) => {
  const cv = document.createElement('canvas'); cv.width = 1280; cv.height = Math.round(1280 * (Y1 - Y0) / (X1 - X0));
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const geo = i < 3 ? screenGeo : new THREE.PlaneGeometry(bb.max.x - bb.min.x, bb.max.y - bb.min.y);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: i > 0, depthWrite: !i }));
  if (i < 3) m.position.z = z; else m.position.set((bb.max.x + bb.min.x) / 2, (bb.max.y + bb.min.y) / 2, z);
  m.renderOrder = i;
  phone.add(m);
  return { ctx: cv.getContext('2d'), tex, m };
});
// glass: reflective sheen over the base layer
const glass = new THREE.Mesh(screenGeo, new THREE.MeshStandardMaterial({ color: 0, metalness: 1, roughness: .05, transparent: true, opacity: .18 }));
glass.position.z = .2005; glass.renderOrder = .5; phone.add(glass); // between the background and the UI layers

// pear silhouette with stem + leaf (y-down units, ~80 tall), as extrudable shapes scaled by k
function pearShapes(k) {
  const f = (x, y) => [x * k, -y * k];
  const sh = (cmds) => { const p = new THREE.Shape(); for (const [m, ...a] of cmds) p[m](...a.flatMap((v, i) => i % 2 ? [] : f(v, a[i + 1]))); return p; };
  return [
    sh([['moveTo', 0, -30], ['bezierCurveTo', 9, -30, 12, -22, 12, -14], ['bezierCurveTo', 12, -4, 32, 4, 32, 22], ['bezierCurveTo', 32, 40, 17, 48, 0, 48],
        ['bezierCurveTo', -17, 48, -32, 40, -32, 22], ['bezierCurveTo', -32, 4, -12, -4, -12, -14], ['bezierCurveTo', -12, -22, -9, -30, 0, -30]]), // body
    sh([['moveTo', -3, -26], ['quadraticCurveTo', -3, -38, 2, -45], ['lineTo', 7, -43], ['quadraticCurveTo', 3, -37, 3, -26]]), // stem
    sh([['moveTo', 4, -36], ['quadraticCurveTo', 12, -50, 28, -45], ['quadraticCurveTo', 18, -31, 4, -36]]), // leaf
  ];
}
const emblem = (k, depth) => new THREE.ExtrudeGeometry(pearShapes(k), { depth, curveSegments: 32, bevelThickness: depth / 2, bevelSize: k * 1.2, bevelSegments: 4 });
// home button: dark tinted glass dome over the phone colour with a light-cyan pear printed on it (as on the show);
// back logo is a chrome pear. Both pears point their stem toward the phone's narrow tip
const dome = new THREE.Mesh(new THREE.SphereGeometry(.13, 48, 24), new THREE.MeshPhysicalMaterial({ color: 0, transparent: true, opacity: .45, roughness: .1, clearcoat: 1 }));
dome.scale.z = .35; dome.position.set(1.76, 0, .27); phone.add(dome); // sits on the flat of the rim (top at z .27)
const btn = new THREE.Mesh(emblem(.0017, .004), new THREE.MeshPhysicalMaterial({ color: 0x8ff0ff, roughness: .2, clearcoat: 1 }));
btn.rotation.z = Math.PI / 2; btn.position.set(1.76, 0, .316); phone.add(btn);
const logoBack = new THREE.Mesh(emblem(.012, .015), chrome);
logoBack.rotation.set(0, Math.PI, -Math.PI / 2); logoBack.position.set(.3, 0, -.262); phone.add(logoBack);

// backdrop plane; setBg takes a canvas or image
export const bg = new THREE.Mesh(new THREE.PlaneGeometry(36, 18), new THREE.MeshBasicMaterial({ toneMapped: false }));
bg.position.z = -8; scene.add(bg);
export function setBg(src) {
  bg.material.map?.dispose();
  const t = new THREE.Texture(src); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true;
  bg.material.map = t; bg.material.needsUpdate = true;
}
