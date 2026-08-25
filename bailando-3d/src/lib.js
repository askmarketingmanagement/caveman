import * as THREE from 'three';
export { THREE };

/* ---------- material palette ---------------------------------------- */
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.02, ...o });

export const MATS = {
  feltGreen : std(0x1d6b4c, { roughness: 0.95 }),
  feltBlue  : std(0x1b4f7d, { roughness: 0.95 }),
  feltRed   : std(0x7c1f31, { roughness: 0.95 }),
  walnut    : std(0x4a3327, { roughness: 0.6 }),
  oak       : std(0xa87c4f, { roughness: 0.68 }),
  teak      : std(0x8d5f3a, { roughness: 0.7 }),
  blackWood : std(0x191a1f, { roughness: 0.55 }),
  brass     : std(0xc9963f, { roughness: 0.3, metalness: 0.9 }),
  chrome    : std(0xc3c8d2, { roughness: 0.18, metalness: 1.0 }),
  gunmetal  : std(0x40454f, { roughness: 0.4, metalness: 0.7 }),
  leatherTan: std(0x8a6141, { roughness: 0.8 }),
  leatherBlk: std(0x24252a, { roughness: 0.75 }),
  velvetRose: std(0x8e3350, { roughness: 1.0 }),
  velvetTeal: std(0x1f5e5c, { roughness: 1.0 }),
  linen     : std(0xb9b2a4, { roughness: 1.0 }),
  concrete  : std(0x8a867e, { roughness: 0.9 }),
  plaster   : std(0xd6d0c4, { roughness: 0.95 }),
  rubber    : std(0x2a2c33, { roughness: 0.95 }),
  foliage   : std(0x35673c, { roughness: 0.95 }),
  foliageLt : std(0x4c8a49, { roughness: 0.95 }),
  terracotta: std(0xa2593c, { roughness: 0.9 }),
  glass     : new THREE.MeshStandardMaterial({ color: 0x9fc4d8, roughness: 0.06, metalness: 0.1, transparent: true, opacity: 0.22 }),
  screenOff : std(0x0a0b0e, { roughness: 0.25 }),
  screenOn  : new THREE.MeshStandardMaterial({ color: 0x101018, emissive: 0x2b4f8a, emissiveIntensity: 1.1, roughness: 0.2 }),
  neonRosa  : new THREE.MeshStandardMaterial({ color: 0xff5c7a, emissive: 0xff5c7a, emissiveIntensity: 2.2, roughness: 0.4 }),
  neonCyan  : new THREE.MeshStandardMaterial({ color: 0x57c7e8, emissive: 0x57c7e8, emissiveIntensity: 2.2, roughness: 0.4 }),
  neonAmber : new THREE.MeshStandardMaterial({ color: 0xffb347, emissive: 0xffb347, emissiveIntensity: 2.0, roughness: 0.4 }),
  ivory     : std(0xe6e1d6, { roughness: 0.6 }),
  white     : std(0xf2efe9, { roughness: 0.7 }),
};

/* ---------- geometry helpers ----------------------------------------- */
// All builders return a Group whose origin sits at floor level (y = 0),
// centred on the footprint, with `w` along +X and `d` along +Z.

export function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y + h / 2, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

export function roundedBox(w, h, d, r, mat, x = 0, y = 0, z = 0) {
  r = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
  const shape = new THREE.Shape();
  const hw = w / 2, hd = d / 2;
  shape.moveTo(-hw + r, -hd);
  shape.lineTo(hw - r, -hd); shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
  shape.lineTo(hw, hd - r);  shape.quadraticCurveTo(hw, hd, hw - r, hd);
  shape.lineTo(-hw + r, hd); shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
  shape.lineTo(-hw, -hd + r);shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
  const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 6 });
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

export function cyl(rTop, rBot, h, mat, x = 0, y = 0, z = 0, seg = 20) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), mat);
  m.position.set(x, y + h / 2, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

export function sphere(r, mat, x = 0, y = 0, z = 0, seg = 16) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

export function group(...children) {
  const g = new THREE.Group();
  children.flat().filter(Boolean).forEach(c => g.add(c));
  return g;
}

/* Four legs inset from the footprint corners. */
export function legs(w, d, h, mat, thick = 0.07, inset = 0.09, round = false) {
  const out = [];
  const xs = [-w / 2 + inset, w / 2 - inset];
  const zs = [-d / 2 + inset, d / 2 - inset];
  for (const x of xs) for (const z of zs) {
    out.push(round ? cyl(thick / 2, thick / 2, h, mat, x, 0, z, 10) : box(thick, h, thick, mat, x, 0, z));
  }
  return out;
}

/* A soft seat cushion row. */
export function cushions(count, w, d, h, mat, y, gap = 0.02) {
  const out = [];
  const cw = (w - gap * (count - 1)) / count;
  for (let i = 0; i < count; i++) {
    const x = -w / 2 + cw / 2 + i * (cw + gap);
    out.push(roundedBox(cw, h, d, 0.05, mat, x, y, 0));
  }
  return out;
}

/* Procedural canvas texture helper. */
export function canvasTexture(w, h, draw, repeatX = 1, repeatY = 1) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeatX, repeatY);
  t.anisotropy = 8;
  return t;
}

export const rand = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(42);

/* Horizontal bar (a cylinder laid along X or Z) placed by its centre. */
export function hbar(len, r, mat, axis, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), mat);
  m.rotation[axis === 'x' ? 'z' : 'x'] = Math.PI / 2;
  m.position.set(x, y, z);
  m.castShadow = true;
  return m;
}
