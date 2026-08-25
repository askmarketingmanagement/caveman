import { THREE, MATS, box, roundedBox, cyl, sphere, group, legs, cushions, hbar } from './lib.js';

/* =====================================================================
   BUILDERS  — each returns a Group centred on its footprint at y = 0,
   with `w` along +X and `d` along +Z.
   ===================================================================== */

const RAIL = 0.155;           // cushion rail width on a pool table
const clothOf = t => ({ green: MATS.feltGreen, blue: MATS.feltBlue, red: MATS.feltRed }[t] || MATS.feltGreen);
const woodOf  = t => ({ walnut: MATS.walnut, oak: MATS.oak, black: MATS.blackWood, teak: MATS.teak }[t] || MATS.walnut);
const fabOf   = t => ({ tan: MATS.leatherTan, black: MATS.leatherBlk, rose: MATS.velvetRose,
                        teal: MATS.velvetTeal, linen: MATS.linen, ivory: MATS.ivory }[t] || MATS.leatherBlk);

function buildPool(playW, playD, o = {}) {
  const cloth = clothOf(o.tone || 'green'), wood = woodOf(o.wood || 'walnut');
  const W = playW + RAIL * 2, D = playD + RAIL * 2;
  const bedY = 0.60, bedH = 0.10, railH = 0.075;
  const g = group(
    box(W, bedH, D, wood, 0, bedY),                                   // cabinet body
    box(playW, 0.012, playD, cloth, 0, bedY + bedH),                  // cloth bed
    box(W, railH, RAIL, cloth, 0, bedY + bedH, -D / 2 + RAIL / 2),    // rails
    box(W, railH, RAIL, cloth, 0, bedY + bedH, D / 2 - RAIL / 2),
    box(RAIL, railH, playD, cloth, -W / 2 + RAIL / 2, bedY + bedH),
    box(RAIL, railH, playD, cloth, W / 2 - RAIL / 2, bedY + bedH),
    box(W + 0.02, 0.05, D + 0.02, wood, 0, bedY + bedH + railH),      // rail cap
  );
  // aprons + legs
  g.add(box(W, 0.30, 0.06, wood, 0, 0.30, -D / 2 + 0.03));
  g.add(box(W, 0.30, 0.06, wood, 0, 0.30, D / 2 - 0.03));
  for (const x of [-W / 2 + 0.13, W / 2 - 0.13])
    for (const z of [-D / 2 + 0.13, D / 2 - 0.13])
      g.add(box(0.19, 0.60, 0.19, wood, x, 0, z));
  // six pockets
  for (const x of [-playW / 2, 0, playW / 2])
    for (const z of [-playD / 2, playD / 2])
      g.add(cyl(0.065, 0.055, 0.09, MATS.leatherBlk, x, bedY + bedH - 0.05, z, 12));
  // rack of balls + a cue laid on the rail
  const ballY = bedY + bedH + 0.028;
  const spot = playW * 0.25;
  let n = 0;
  for (let r = 0; r < 4; r++) for (let c = 0; c <= r; c++) {
    const hue = [0xf0c419, 0x2d63b5, 0xd0342c, 0x5b3a86, 0xe08a2e, 0x2e8b57, 0x8b2f2f, 0x14151a][n++ % 8];
    g.add(sphere(0.028, new THREE.MeshStandardMaterial({ color: hue, roughness: 0.18, metalness: 0.05 }),
      spot + r * 0.05, ballY, (c - r / 2) * 0.058, 12));
  }
  g.add(sphere(0.028, MATS.white, -spot, ballY, 0, 12));
  const cue = cyl(0.007, 0.013, 1.45, MATS.oak, 0, bedY + bedH + railH + 0.06, -D / 2 + RAIL / 2, 8);
  cue.rotation.z = Math.PI / 2; g.add(cue);
  // triangle light over the table
  if (o.light !== false) {
    const shade = group(
      box(W * 0.62, 0.10, 0.26, MATS.blackWood, 0, 1.86),
      box(W * 0.60, 0.02, 0.24, MATS.neonAmber, 0, 1.855),
    );
    for (const x of [-W * 0.24, W * 0.24]) shade.add(cyl(0.008, 0.008, 0.85, MATS.gunmetal, x, 1.96, 0, 6));
    g.add(shade);
  }
  return g;
}

function buildSofa(w, d, o = {}) {
  const fab = fabOf(o.tone || 'black'), n = Math.max(1, Math.round(w / 0.72));
  const seatY = 0.40, backH = 0.36, armW = 0.16;
  const inner = w - armW * 2;
  return group(
    roundedBox(w, seatY, d, 0.05, fab, 0, 0, 0),                                  // plinth
    cushions(n, inner, d - 0.14, 0.15, fab, seatY, 0.02).map(c => (c.position.z = 0.04, c)),
    roundedBox(inner, backH, 0.16, 0.06, fab, 0, seatY + 0.10, -d / 2 + 0.10),    // back
    roundedBox(armW, 0.26, d, 0.05, fab, -w / 2 + armW / 2, seatY, 0),            // arms
    roundedBox(armW, 0.26, d, 0.05, fab, w / 2 - armW / 2, seatY, 0),
    legs(w - 0.1, d - 0.1, 0.08, MATS.brass, 0.04, 0.08, true).map(l => (l.position.y = 0.04, l)),
  );
}

function buildSectional(w, d, o = {}) {
  o = { tone: 'teal', ...o };
  const armD = 0.95;                                    // return leg depth
  const g = buildSofa(w, armD, o);
  g.position.z = d / 2 - armD / 2;
  const wrap = buildSofa(d - armD, armD, o);
  wrap.rotation.y = -Math.PI / 2;
  wrap.position.set(-w / 2 + armD / 2, 0, -armD / 2 + 0.02);
  return group(g, wrap);
}

function buildArmchair(o = {}) {
  const fab = fabOf(o.tone || 'rose');
  return group(
    roundedBox(0.82, 0.38, 0.82, 0.06, fab, 0, 0),
    roundedBox(0.62, 0.14, 0.66, 0.05, fab, 0, 0.38, 0.04),
    roundedBox(0.66, 0.42, 0.15, 0.07, fab, 0, 0.46, -0.32),
    roundedBox(0.10, 0.22, 0.78, 0.04, fab, -0.36, 0.38, 0),
    roundedBox(0.10, 0.22, 0.78, 0.04, fab, 0.36, 0.38, 0),
    legs(0.66, 0.66, 0.12, MATS.brass, 0.035, 0.06, true).map(l => (l.position.y = 0.06, l)),
  );
}

function buildBeanbag(o = {}) {
  const fab = fabOf(o.tone || 'rose');
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.46, 18, 14), fab);
  m.scale.set(1, 0.62, 1); m.position.y = 0.30;
  m.castShadow = true; m.receiveShadow = true;
  const top = sphere(0.30, fab, 0, 0.52, -0.10, 14); top.scale.set(1, 0.7, 1);
  return group(m, top);
}

function buildTable(w, d, h, o = {}, round = false) {
  const wood = woodOf(o.wood || 'walnut');
  if (round) return group(
    cyl(w / 2, w / 2, 0.05, wood, 0, h - 0.05, 0, 24),
    cyl(0.05, 0.05, h - 0.05, MATS.gunmetal, 0, 0, 0, 12),
    cyl(w * 0.28, w * 0.30, 0.03, MATS.gunmetal, 0, 0, 0, 20),
  );
  return group(
    roundedBox(w, 0.05, d, 0.02, wood, 0, h - 0.05),
    legs(w, d, h - 0.05, MATS.gunmetal, 0.05, 0.08, true),
  );
}

function buildBarStool(o = {}) {
  const fab = fabOf(o.tone || 'tan');
  const g = group(
    cyl(0.19, 0.19, 0.09, fab, 0, 0.66, 0, 18),
    cyl(0.045, 0.045, 0.66, MATS.brass, 0, 0, 0, 12),
    cyl(0.21, 0.23, 0.03, MATS.gunmetal, 0, 0, 0, 18),
  );
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.012, 8, 20), MATS.brass);
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.23; g.add(ring);
  const back = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.018, 8, 20, Math.PI), MATS.brass);
  back.position.set(0, 0.92, 0.02); g.add(back);
  return g;
}

function buildDiningSet(o = {}) {
  const g = group(buildTable(0.90, 0.90, 0.75, o));
  for (let i = 0; i < 4; i++) {
    const c = buildChair(o);
    c.rotation.y = i * Math.PI / 2 + Math.PI;
    const off = 0.68;
    c.position.set(i === 0 ? 0 : i === 2 ? 0 : (i === 1 ? off : -off), 0, i === 0 ? off : i === 2 ? -off : 0);
    g.add(c);
  }
  return g;
}

function buildChair(o = {}) {
  const fab = fabOf(o.tone || 'tan');
  return group(
    roundedBox(0.46, 0.06, 0.46, 0.03, fab, 0, 0.44),
    roundedBox(0.44, 0.46, 0.06, 0.04, fab, 0, 0.50, -0.20),
    legs(0.42, 0.42, 0.44, MATS.gunmetal, 0.03, 0.04, true),
  );
}

function buildGamingChair(o = {}) {
  const fab = fabOf(o.tone || 'black');
  const g = group(
    roundedBox(0.54, 0.10, 0.52, 0.05, fab, 0, 0.42),
    cyl(0.05, 0.05, 0.42, MATS.gunmetal, 0, 0, 0, 10),
  );
  const back = roundedBox(0.50, 0.72, 0.12, 0.06, fab, 0, 0.52, -0.22);
  back.rotation.x = -0.12; g.add(back);
  g.add(roundedBox(0.10, 0.07, 0.30, 0.03, MATS.leatherBlk, -0.30, 0.60, -0.02));
  g.add(roundedBox(0.10, 0.07, 0.30, 0.03, MATS.leatherBlk, 0.30, 0.60, -0.02));
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;
    g.add(box(0.30, 0.04, 0.06, MATS.gunmetal, Math.cos(a) * 0.15, 0.02, Math.sin(a) * 0.15));
  }
  const stripe = box(0.06, 0.60, 0.13, MATS.neonRosa, 0, 0.58, -0.22); g.add(stripe);
  return g;
}

/* screenW = diagonal in inches → 16:9 panel */
function panelSize(inches) {
  const diag = inches * 0.0254;
  return { w: diag * 0.8716, h: diag * 0.4903 };
}

function buildTvOnStand(inches, o = {}) {
  const p = panelSize(inches);
  const wood = woodOf(o.wood || 'black');
  const standW = Math.max(1.4, p.w + 0.2);
  const g = group(
    roundedBox(standW, 0.46, 0.40, 0.02, wood, 0, 0.08),
    legs(standW - 0.2, 0.30, 0.08, MATS.brass, 0.04, 0.06, true).map(l => (l.position.y = 0.04, l)),
    box(0.30, 0.03, 0.20, MATS.gunmetal, 0, 0.54),
    cyl(0.03, 0.03, 0.16, MATS.gunmetal, 0, 0.57, 0, 8),
  );
  const bezel = box(p.w + 0.03, p.h + 0.03, 0.05, MATS.blackWood, 0, 0.73);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.h), MATS.screenOn.clone());
  face.position.set(0, 0.73 + (p.h + 0.03) / 2, 0.026);
  g.add(bezel, face);
  g.userData.screen = face;
  // console + controllers on the shelf
  g.add(box(0.10, 0.26, 0.22, MATS.white, standW / 2 - 0.28, 0.20, 0.02));
  g.add(roundedBox(0.16, 0.05, 0.11, 0.02, MATS.white, standW / 2 - 0.52, 0.31, 0.02));
  g.add(roundedBox(0.16, 0.05, 0.11, 0.02, MATS.white, standW / 2 - 0.72, 0.31, 0.02));
  return g;
}

function buildLedWall(w, h, o = {}) {
  const g = group(box(w, h, 0.14, MATS.blackWood, 0, 0.30));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.06, h - 0.06), MATS.screenOn.clone());
  face.position.set(0, 0.30 + h / 2, 0.075);
  g.add(face);
  g.userData.screen = face;
  g.add(box(w + 0.1, 0.30, 0.30, MATS.gunmetal, 0, 0));
  return g;
}

function buildBar(w, o = {}) {
  const wood = woodOf(o.wood || 'walnut');
  const g = group(
    box(w, 1.00, 0.60, wood, 0, 0),
    box(w + 0.08, 0.05, 0.72, MATS.concrete, 0, 1.00),
    box(w - 0.10, 0.04, 0.06, MATS.neonCyan, 0, 0.20, 0.31),
  );
  for (let i = 0; i < Math.floor(w / 0.6); i++)
    g.add(box(0.02, 0.90, 0.02, MATS.brass, -w / 2 + 0.3 + i * 0.6, 0.05, 0.305));
  return g;
}

function buildBackBar(w, o = {}) {
  const wood = woodOf(o.wood || 'black');
  const g = group(box(w, 0.90, 0.45, wood, 0, 0), box(w, 0.05, 0.50, MATS.concrete, 0, 0.90));
  for (let s = 0; s < 3; s++) {
    const y = 1.15 + s * 0.38;
    g.add(box(w - 0.1, 0.04, 0.28, MATS.brass, 0, y, -0.05));
    g.add(box(w - 0.14, 0.02, 0.26, MATS.neonAmber, 0, y - 0.03, -0.05));
    for (let b = 0; b < Math.floor((w - 0.3) / 0.11); b++) {
      const bm = [MATS.brass, MATS.glass, MATS.feltGreen][b % 3];
      g.add(cyl(0.035, 0.035, 0.26, bm, -w / 2 + 0.18 + b * 0.11, y + 0.04, -0.05, 8));
    }
  }
  return g;
}

function buildDjBooth(o = {}) {
  const g = group(
    box(1.80, 1.05, 0.70, MATS.blackWood, 0, 0),
    box(1.86, 0.05, 0.76, MATS.concrete, 0, 1.05),
    box(1.70, 0.06, 0.04, MATS.neonRosa, 0, 0.40, 0.36),
    box(1.70, 0.06, 0.04, MATS.neonRosa, 0, 0.62, 0.36),
    box(0.62, 0.08, 0.42, MATS.gunmetal, 0, 1.10, -0.02),
  );
  for (const x of [-0.52, 0.52]) {
    g.add(box(0.36, 0.06, 0.42, MATS.gunmetal, x, 1.10, -0.02));
    g.add(cyl(0.11, 0.11, 0.02, MATS.chrome, x, 1.16, -0.04, 18));
  }
  return g;
}

function buildSpeaker(h, o = {}) {
  const w = h * 0.42;
  const g = group(box(w, h, w * 0.85, MATS.blackWood, 0, 0));
  g.add(cyl(w * 0.32, w * 0.32, 0.03, MATS.rubber, 0, h * 0.30, w * 0.42, 16));
  g.add(cyl(w * 0.16, w * 0.16, 0.03, MATS.rubber, 0, h * 0.72, w * 0.42, 12));
  const c = g.children[1], d = g.children[2];
  c.rotation.x = Math.PI / 2; d.rotation.x = Math.PI / 2;
  return g;
}

function buildFoosball(o = {}) {
  const wood = woodOf(o.wood || 'black');
  const g = group(
    box(1.45, 0.20, 0.76, wood, 0, 0.70),
    box(1.36, 0.02, 0.68, MATS.feltGreen, 0, 0.79),
    ...legs(1.45, 0.76, 0.70, wood, 0.10, 0.07),
  );
  for (let i = 0; i < 8; i++) {
    const x = -0.62 + i * 0.177;
    const r = cyl(0.008, 0.008, 1.0, MATS.chrome, x, 0.86, 0, 8);
    r.rotation.x = Math.PI / 2; g.add(r);
    const men = i % 2 ? MATS.neonRosa : MATS.neonCyan;
    for (let k = -1; k <= 1; k++) g.add(box(0.05, 0.13, 0.05, men, x, 0.80, k * 0.2));
  }
  return g;
}

function buildAirHockey(o = {}) {
  const g = group(
    box(2.13, 0.22, 1.17, MATS.blackWood, 0, 0.58),
    box(2.03, 0.02, 1.07, MATS.ivory, 0, 0.80),
    ...legs(2.13, 1.17, 0.58, MATS.gunmetal, 0.09, 0.10),
    box(2.03, 0.03, 0.02, MATS.neonCyan, 0, 0.82, 0),
    cyl(0.05, 0.05, 0.02, MATS.neonRosa, -0.4, 0.81, 0.2, 14),
    cyl(0.05, 0.05, 0.02, MATS.neonRosa, 0.5, 0.81, -0.15, 14),
  );
  return g;
}

function buildArcade(o = {}) {
  const g = group(box(0.70, 1.30, 0.80, MATS.blackWood, 0, 0));
  const top = box(0.70, 0.52, 0.42, MATS.blackWood, 0, 1.30, -0.14); g.add(top);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.42), MATS.screenOn.clone());
  face.position.set(0, 1.56, 0.09); face.rotation.x = -0.18; g.add(face);
  g.userData.screen = face;
  g.add(box(0.66, 0.06, 0.34, MATS.gunmetal, 0, 1.24, 0.16));
  g.add(cyl(0.02, 0.02, 0.12, MATS.neonRosa, -0.16, 1.30, 0.16, 8));
  for (let i = 0; i < 4; i++) g.add(cyl(0.022, 0.022, 0.02, MATS.neonAmber, 0.02 + (i % 2) * 0.1, 1.31, 0.10 + Math.floor(i / 2) * 0.1, 10));
  g.add(box(0.72, 0.14, 0.06, MATS.neonRosa, 0, 1.82, -0.14));
  return g;
}

function buildDarts(o = {}) {
  const g = group(box(0.80, 0.10, 0.14, MATS.blackWood, 0, 1.30));
  const cab = box(0.80, 0.75, 0.14, MATS.walnut, 0, 1.40); g.add(cab);
  const board = cyl(0.227, 0.227, 0.03, MATS.feltGreen, 0, 1.72, 0.075, 24);
  board.rotation.x = Math.PI / 2; g.add(board);
  const bull = cyl(0.03, 0.03, 0.01, MATS.neonRosa, 0, 1.73, 0.09, 12);
  bull.rotation.x = Math.PI / 2; g.add(bull);
  g.add(box(0.60, 0.02, 0.05, MATS.brass, 0, 0.005, 2.37));   // oche / throw line
  return g;
}

function buildShuffleboard(len, o = {}) {
  const wood = woodOf(o.wood || 'oak');
  return group(
    box(0.56, 0.20, len, MATS.blackWood, 0, 0.70),
    box(0.51, 0.02, len - 0.04, wood, 0, 0.90),
    box(0.62, 0.86, 0.40, MATS.blackWood, 0, 0, -len / 2 + 0.2),
    box(0.62, 0.86, 0.40, MATS.blackWood, 0, 0, len / 2 - 0.2),
    box(0.56, 0.03, 0.02, MATS.neonCyan, 0, 0.92, -len / 2 + 0.5),
    box(0.56, 0.03, 0.02, MATS.neonCyan, 0, 0.92, len / 2 - 0.5),
  );
}

function buildPlanter(w, d, o = {}) {
  const g = group(box(w, 0.72, d, MATS.terracotta, 0, 0), box(w - 0.06, 0.04, d - 0.06, MATS.walnut, 0, 0.70));
  const n = Math.max(3, Math.round(w * 5));
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 0.1 + (i / (n - 1 || 1)) * (w - 0.2);
    const z = (((i * 37) % 10) / 10 - 0.5) * (d - 0.2);
    const hgt = 0.5 + ((i * 53) % 10) / 10 * 0.7;
    g.add(cyl(0.02, 0.03, hgt, MATS.foliage, x, 0.74, z, 6));
    const bl = sphere(0.20 + ((i * 29) % 10) / 100, i % 2 ? MATS.foliage : MATS.foliageLt, x, 0.74 + hgt, z, 10);
    bl.scale.set(1, 0.8, 1); g.add(bl);
  }
  return g;
}

function buildPergola(w, d, o = {}) {
  const wood = woodOf(o.wood || 'teak');
  const g = group();
  for (const x of [-w / 2 + 0.09, w / 2 - 0.09]) for (const z of [-d / 2 + 0.09, d / 2 - 0.09])
    g.add(box(0.14, 2.55, 0.14, wood, x, 0, z));
  g.add(box(w, 0.16, 0.14, wood, 0, 2.55, -d / 2 + 0.07));
  g.add(box(w, 0.16, 0.14, wood, 0, 2.55, d / 2 - 0.07));
  const n = Math.floor(d / 0.34);
  for (let i = 0; i <= n; i++) g.add(box(w + 0.1, 0.10, 0.05, wood, 0, 2.62, -d / 2 + i * (d / n)));
  for (let i = 0; i <= Math.floor(w / 0.9); i++)
    g.add(sphere(0.035, MATS.neonAmber, -w / 2 + i * 0.9, 2.50, 0, 8));
  return g;
}

function buildUmbrella(dia, o = {}) {
  const g = group(cyl(0.045, 0.045, 2.30, MATS.teak, 0, 0, 0, 10), cyl(0.30, 0.34, 0.12, MATS.gunmetal, 0, 0, 0, 16));
  const can = new THREE.Mesh(new THREE.ConeGeometry(dia / 2, 0.42, 8, 1), fabOf(o.tone || 'linen'));
  can.position.y = 2.42; can.castShadow = true; g.add(can);
  return g;
}

function buildHeater() {
  return group(
    cyl(0.24, 0.30, 0.04, MATS.gunmetal, 0, 0, 0, 18),
    cyl(0.04, 0.04, 1.85, MATS.chrome, 0, 0.04, 0, 12),
    cyl(0.42, 0.20, 0.22, MATS.chrome, 0, 1.89, 0, 18),
    cyl(0.18, 0.18, 0.06, MATS.neonAmber, 0, 1.84, 0, 18),
  );
}

function buildFirepit() {
  const g = group(cyl(0.45, 0.50, 0.42, MATS.concrete, 0, 0, 0, 22), cyl(0.36, 0.36, 0.06, MATS.blackWood, 0, 0.40, 0, 22));
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2;
    g.add(sphere(0.05 + (i % 3) * 0.01, MATS.neonAmber, Math.cos(a) * 0.16, 0.47, Math.sin(a) * 0.16, 8));
  }
  return g;
}

function buildColumn(w, d, h) {
  return group(box(w, h, d, MATS.concrete, 0, 0), box(w + 0.1, 0.12, d + 0.1, MATS.concrete, 0, h - 0.12));
}

function buildStairOpening(w, d) {
  const g = group();
  const steps = 7;
  for (let i = 0; i < steps; i++)
    g.add(box(w - 0.2, 0.04, d / steps - 0.03, MATS.concrete, 0, -0.05 - i * 0.17 + 1.0, -d / 2 + (i + 0.5) * (d / steps)));
  for (const x of [-w / 2 + 0.06, w / 2 - 0.06]) {
    g.add(box(0.06, 1.0, d, MATS.glass, x, 0, 0));
    g.add(hbar(d, 0.025, MATS.brass, 'z', x, 1.06, 0));
  }
  return g;
}

function buildRailing(w, o = {}) {
  const g = group(box(w, 0.06, 0.10, MATS.gunmetal, 0, 0));
  g.add(box(w, 1.02, 0.02, MATS.glass, 0, 0.06));
  g.add(hbar(w, 0.028, MATS.brass, 'x', 0, 1.10, 0));
  for (let i = 0; i <= Math.floor(w / 1.2); i++)
    g.add(box(0.05, 1.10, 0.05, MATS.gunmetal, -w / 2 + i * (w / Math.max(1, Math.floor(w / 1.2))), 0, 0));
  return g;
}

function buildRug(w, d, o = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), fabOf(o.tone || 'rose'));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.006; m.receiveShadow = true;
  return group(m);
}

function buildMediaPanel(w, h, o = {}) {
  const g = group(box(w + 0.06, h + 0.06, 0.06, MATS.blackWood, 0, o.floor === false ? 0.9 : 0));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ color: 0x2a2f3d, roughness: 0.9 }));
  face.position.set(0, (o.floor === false ? 0.9 : 0) + (h + 0.06) / 2, 0.032);
  g.add(face); g.userData.screen = face;
  if (o.floor !== false) { g.add(box(0.5, 0.05, 0.35, MATS.gunmetal, 0, 0, 0.12)); }
  return g;
}

function buildPhotoBooth() {
  const g = group(
    box(1.20, 2.20, 0.90, MATS.velvetRose, 0, 0),
    box(1.10, 0.10, 0.06, MATS.neonRosa, 0, 2.00, 0.46),
  );
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.36), MATS.screenOn.clone());
  face.position.set(0, 1.45, 0.455); g.add(face); g.userData.screen = face;
  return g;
}

/* =====================================================================
   CATALOGUE
   ===================================================================== */

export const GROUPS = ['Pool & games', 'PS5 & screens', 'Seating', 'Bar & service',
                       'Terrace & structure', 'Your images', 'Zones'];

export const CATALOG = [
  /* ---- Pool & games ------------------------------------------------- */
  { key: 'pool7', group: 'Pool & games', name: 'Pool table — 7 ft (bar size)',
    w: 2.13, d: 1.15, h: 0.82, clear: 1.50, clearDir: 'ring', hard: true,  seats: 0, kg: 300, tone: 'green', wood: 'walnut',
    clearNote: 'Cue swing 1.5 m all round', spec: 'Play surface 1.98 × 0.99 m · 57" cue',
    note: 'Smallest table that still plays properly. Needs a 5.13 × 4.15 m clear box.',
    build: o => buildPool(1.98, 0.99, o) },

  { key: 'pool8', group: 'Pool & games', name: 'Pool table — 8 ft',
    w: 2.39, d: 1.27, h: 0.82, clear: 1.50, clearDir: 'ring', hard: true,  seats: 0, kg: 360, tone: 'green', wood: 'walnut',
    clearNote: 'Cue swing 1.5 m all round', spec: 'Play surface 2.24 × 1.12 m · 57" cue',
    note: 'The usual club choice. Needs a 5.39 × 4.27 m clear box. Slate ~360 kg — flag to your structural engineer.',
    build: o => buildPool(2.24, 1.12, o) },

  { key: 'pool9', group: 'Pool & games', name: 'Pool table — 9 ft (tournament)',
    w: 2.70, d: 1.47, h: 0.82, clear: 1.50, clearDir: 'ring', hard: true,  seats: 0, kg: 480, tone: 'blue', wood: 'black',
    clearNote: 'Cue swing 1.5 m all round', spec: 'Play surface 2.54 × 1.27 m · 57" cue',
    note: 'Needs a 5.70 × 4.47 m clear box — the single biggest constraint on this terrace. ~480 kg on four legs is a point load, not a spread load.',
    build: o => buildPool(2.54, 1.27, o) },

  { key: 'foos', group: 'Pool & games', name: 'Foosball table', w: 1.45, d: 0.76, h: 0.90,
    clear: 0.90, clearDir: 'ends', hard: true,  seats: 0, kg: 85, wood: 'black', clearNote: 'Player space 0.9 m each end',
    spec: '1.45 × 0.76 m · 8 rods', note: 'Rods slide out ~0.35 m past the ends — leave the side gaps clear.',
    build: o => buildFoosball(o) },

  { key: 'airh', group: 'Pool & games', name: 'Air hockey table', w: 2.13, d: 1.17, h: 0.80,
    clear: 0.85, clearDir: 'ends', hard: true,  seats: 0, kg: 110, clearNote: 'Player space 0.85 m each end',
    spec: '2.13 × 1.17 m · mains powered', note: 'Blower is loud — keep it away from the lounge seating.',
    build: o => buildAirHockey(o) },

  { key: 'arcade', group: 'Pool & games', name: 'Arcade cabinet', w: 0.70, d: 0.85, h: 1.85,
    clear: 0.80, clearDir: 'front', hard: true,  seats: 0, kg: 130, clearNote: 'Standing space 0.8 m in front',
    spec: '0.70 × 0.85 m · 1.85 m tall', note: 'Weather matters — a cabinet on an open terrace needs cover.',
    build: o => buildArcade(o) },

  { key: 'darts', group: 'Pool & games', name: 'Dartboard cabinet + oche', w: 0.80, d: 2.60, h: 2.15,
    clear: 0, clearDir: 'ring',  seats: 0, kg: 25, clearNote: 'Throw lane 2.37 m to the oche',
    spec: 'Bull at 1.73 m · oche 2.37 m', note: 'The footprint here IS the throw lane. Never point it across a walkway.',
    build: o => buildDarts(o) },

  { key: 'shuffle', group: 'Pool & games', name: 'Shuffleboard — 9 ft', w: 0.62, d: 2.75, h: 0.90,
    clear: 0.80, clearDir: 'ends', hard: true,  seats: 0, kg: 160, wood: 'oak', clearNote: 'Player space 0.8 m each end',
    spec: '2.75 m long · maple bed', note: 'A 12 ft or 14 ft board plays better but eats a whole wall.',
    build: o => buildShuffleboard(2.75, o) },

  /* ---- PS5 & screens ------------------------------------------------ */
  { key: 'ps5-55', group: 'PS5 & screens', name: 'PS5 station — 55" screen', w: 1.60, d: 0.45, h: 1.45,
    clear: 0.50, clearDir: 'front',  seats: 0, kg: 45, wood: 'black', view: [1.4, 2.1], clearNote: 'Seats 1.4–2.1 m back',
    spec: '55" panel 1.22 × 0.69 m', note: 'Sit players 1.4–2.1 m back. The cyan cone shows the good zone.',
    build: o => buildTvOnStand(55, o) },

  { key: 'ps5-65', group: 'PS5 & screens', name: 'PS5 station — 65" screen', w: 1.70, d: 0.45, h: 1.55,
    clear: 0.50, clearDir: 'front',  seats: 0, kg: 55, wood: 'black', view: [1.6, 2.5], clearNote: 'Seats 1.6–2.5 m back',
    spec: '65" panel 1.44 × 0.81 m', note: 'Best all-rounder for a station two people watch and two play.',
    build: o => buildTvOnStand(65, o) },

  { key: 'ps5-75', group: 'PS5 & screens', name: 'PS5 station — 75" screen', w: 1.90, d: 0.45, h: 1.70,
    clear: 0.50, clearDir: 'front',  seats: 0, kg: 70, wood: 'black', view: [1.9, 2.9], clearNote: 'Seats 1.9–2.9 m back',
    spec: '75" panel 1.66 × 0.93 m', note: 'Only worth it if you can pull seating back past 1.9 m.',
    build: o => buildTvOnStand(75, o) },

  { key: 'gchair', group: 'PS5 & screens', name: 'Gaming chair', w: 0.70, d: 0.70, h: 1.25,
    clear: 0.30, clearDir: 'ring',  seats: 1, kg: 20, tone: 'black', spec: 'Swivel base Ø0.70 m',
    note: 'Swivel base sweeps wider than it looks — keep 0.3 m clear.', build: o => buildGamingChair(o) },

  { key: 'ledwall', group: 'PS5 & screens', name: 'LED video wall — 3 × 2 m', w: 3.00, d: 0.30, h: 2.30,
    clear: 0.60, clearDir: 'front', hard: true,  seats: 0, kg: 180, spec: '3.0 × 2.0 m active area',
    note: 'Put your reel on this — select it and load a video. Needs a dedicated circuit.',
    build: o => buildLedWall(3.0, 2.0, o) },

  { key: 'booth-photo', group: 'PS5 & screens', name: 'Photo booth', w: 1.20, d: 0.90, h: 2.20,
    clear: 0.80, clearDir: 'front', hard: true,  seats: 0, kg: 90, spec: '1.20 × 0.90 m', note: 'Queue forms in front — give it 0.8 m and keep it off the main route.',
    build: o => buildPhotoBooth(o) },

  /* ---- Seating ------------------------------------------------------ */
  { key: 'sofa2', group: 'Seating', name: 'Sofa — 2 seat', w: 1.50, d: 0.88, h: 0.76,
    clear: 0.45, clearDir: 'front',  seats: 2, kg: 45, tone: 'teal', spec: '1.50 × 0.88 m', note: '',
    build: o => buildSofa(1.50, 0.88, o) },

  { key: 'sofa3', group: 'Seating', name: 'Sofa — 3 seat', w: 2.10, d: 0.92, h: 0.76,
    clear: 0.45, clearDir: 'front',  seats: 3, kg: 62, tone: 'teal', spec: '2.10 × 0.92 m', note: '',
    build: o => buildSofa(2.10, 0.92, o) },

  { key: 'sectional', group: 'Seating', name: 'L-shape sectional', w: 2.60, d: 1.90, h: 0.76,
    clear: 0.45, clearDir: 'front',  seats: 5, kg: 110, tone: 'teal', spec: '2.60 × 1.90 m corner unit',
    note: 'Anchors a lounge corner. Outdoor-grade foam only — this is an open terrace.',
    build: o => buildSectional(2.60, 1.90, o) },

  { key: 'armchair', group: 'Seating', name: 'Lounge chair', w: 0.82, d: 0.82, h: 0.80,
    clear: 0.40, clearDir: 'front',  seats: 1, kg: 18, tone: 'rose', spec: '0.82 × 0.82 m', note: '',
    build: o => buildArmchair(o) },

  { key: 'beanbag', group: 'Seating', name: 'Bean bag', w: 0.92, d: 0.92, h: 0.62,
    clear: 0.30, clearDir: 'front',  seats: 1, kg: 8, tone: 'rose', spec: 'Ø0.92 m',
    note: 'Cheapest way to seat the PS5 zone. Gets dragged around — plan for it.', build: o => buildBeanbag(o) },

  { key: 'coffee', group: 'Seating', name: 'Coffee table', w: 1.10, d: 0.60, h: 0.42,
    clear: 0, clearDir: 'ring',  seats: 0, kg: 22, wood: 'walnut', spec: '1.10 × 0.60 m', note: '',
    build: o => buildTable(1.10, 0.60, 0.42, o) },

  { key: 'cocktail', group: 'Seating', name: 'High cocktail table', w: 0.60, d: 0.60, h: 1.05,
    clear: 0.55, clearDir: 'ring',  seats: 0, kg: 16, wood: 'black', spec: 'Ø0.60 m · 1.05 m tall',
    note: 'Four people stand around one. Best density per square metre on the terrace.',
    build: o => buildTable(0.60, 0.60, 1.05, o, true) },

  { key: 'dining4', group: 'Seating', name: 'Dining table — 4 seat', w: 1.80, d: 1.80, h: 0.76,
    clear: 0.30, clearDir: 'ring',  seats: 4, kg: 55, wood: 'teak', tone: 'tan', spec: 'Table 0.90 × 0.90 m + 4 chairs',
    note: 'The 1.80 m footprint already includes pulled-out chairs.', build: o => buildDiningSet(o) },

  { key: 'stool', group: 'Seating', name: 'Bar stool', w: 0.42, d: 0.42, h: 0.95,
    clear: 0, clearDir: 'ring',  seats: 1, kg: 9, tone: 'tan', spec: 'Seat at 0.66 m', note: '',
    build: o => buildBarStool(o) },

  { key: 'rug', group: 'Seating', name: 'Outdoor rug — 2.4 × 1.7 m', w: 2.40, d: 1.70, h: 0.01,
    clear: 0, clearDir: 'ring',  seats: 0, kg: 6, tone: 'rose', spec: '2.40 × 1.70 m', flat: true,
    note: 'Defines a zone without blocking anything. Free to move later.', build: o => buildRug(2.40, 1.70, o) },

  /* ---- Bar & service ------------------------------------------------ */
  { key: 'bar24', group: 'Bar & service', name: 'Bar counter — 2.4 m', w: 2.40, d: 0.72, h: 1.05,
    clear: 0.90, clearDir: 'back', hard: true,  seats: 0, kg: 140, wood: 'walnut', clearNote: 'Service side 0.9 m',
    spec: '2.40 × 0.72 m · 1.05 m tall', note: 'Staff need 0.9 m behind. Stools go on the other side.',
    build: o => buildBar(2.40, o) },

  { key: 'bar36', group: 'Bar & service', name: 'Bar counter — 3.6 m', w: 3.60, d: 0.72, h: 1.05,
    clear: 0.90, clearDir: 'back', hard: true,  seats: 0, kg: 200, wood: 'walnut', clearNote: 'Service side 0.9 m',
    spec: '3.60 × 0.72 m · 1.05 m tall', note: 'Seats about six stools comfortably.', build: o => buildBar(3.60, o) },

  { key: 'backbar', group: 'Bar & service', name: 'Back bar / bottle display', w: 2.40, d: 0.50, h: 2.25,
    clear: 0.90, clearDir: 'front', hard: true,  seats: 0, kg: 120, wood: 'black', clearNote: 'Staff aisle 0.9 m',
    spec: '2.40 × 0.50 m · 2.25 m tall', note: 'Pair with a counter, 0.9 m apart, so one bartender can reach both.',
    build: o => buildBackBar(2.40, o) },

  { key: 'dj', group: 'Bar & service', name: 'DJ booth', w: 1.80, d: 0.70, h: 1.10,
    clear: 0.80, clearDir: 'back', hard: true,  seats: 0, kg: 90, clearNote: 'DJ space 0.8 m behind',
    spec: '1.80 × 0.70 m', note: 'Sightline to the dance area matters more than the wall it sits against.',
    build: o => buildDjBooth(o) },

  { key: 'spk', group: 'Bar & service', name: 'Speaker on stand', w: 0.50, d: 0.45, h: 1.20,
    clear: 0, clearDir: 'ring',  seats: 0, kg: 22, spec: '0.50 × 0.45 m · 1.20 m',
    note: 'Aim across the terrace, not over the parapet — that is where noise complaints come from.',
    build: o => buildSpeaker(1.20, o) },

  /* ---- Terrace & structure ------------------------------------------ */
  { key: 'pergola', group: 'Terrace & structure', name: 'Pergola — 4 × 3 m', w: 4.00, d: 3.00, h: 2.70,
    clear: 0, clearDir: 'ring', overhead: true,  seats: 0, kg: 250, wood: 'teak', spec: '4.00 × 3.00 m · 2.55 m clear head',
    note: 'Cover the pool table or the PS5 zone with this — electronics outdoors need it.',
    build: o => buildPergola(4.0, 3.0, o) },

  { key: 'umbrella', group: 'Terrace & structure', name: 'Umbrella — Ø3 m', w: 3.00, d: 3.00, h: 2.60,
    clear: 0, clearDir: 'ring', overhead: true,  seats: 0, kg: 35, tone: 'linen', spec: 'Ø3.00 m canopy',
    note: 'Canopy overhangs the base by 1.5 m — that is the footprint shown.', build: o => buildUmbrella(3.0, o) },

  { key: 'planter', group: 'Terrace & structure', name: 'Planter — 1.2 m', w: 1.20, d: 0.45, h: 1.45,
    clear: 0, clearDir: 'ring',  seats: 0, kg: 120, spec: '1.20 × 0.45 m · planted to ~1.45 m',
    note: 'Filled with wet soil this is heavy. Use it as a soft divider between zones.',
    build: o => buildPlanter(1.20, 0.45, o) },

  { key: 'firepit', group: 'Terrace & structure', name: 'Fire pit', w: 1.00, d: 1.00, h: 0.46,
    clear: 1.00, clearDir: 'ring', hard: true,  seats: 0, kg: 90, clearNote: 'Keep 1.0 m clear of anything',
    spec: 'Ø1.00 m', note: 'Check your fire NOC before ordering. Nothing soft within a metre.',
    build: o => buildFirepit(o) },

  { key: 'heater', group: 'Terrace & structure', name: 'Patio heater', w: 0.70, d: 0.70, h: 2.10,
    clear: 0.90, clearDir: 'ring', hard: true,  seats: 0, kg: 30, clearNote: 'Keep 0.9 m clear',
    spec: 'Ø0.70 m base · 2.10 m tall', note: 'Never under the pergola roof.', build: o => buildHeater(o) },

  { key: 'column', group: 'Terrace & structure', name: 'Structural column', w: 0.45, d: 0.45, h: 3.00,
    clear: 0, clearDir: 'ring',  seats: 0, kg: 0, fixed: true, spec: '0.45 × 0.45 m',
    note: 'Model the real ones. Everything has to work around these.', build: o => buildColumn(0.45, 0.45, 3.0) },

  { key: 'stair', group: 'Terrace & structure', name: 'Stair from 7th floor', w: 1.40, d: 3.20, h: 1.10,
    clear: 1.20, clearDir: 'ring', hard: true,  seats: 0, kg: 0, fixed: true, clearNote: 'Landing must stay 1.2 m clear',
    spec: '1.40 × 3.20 m opening', note: 'This is your only arrival point and your escape route. Nothing parks in the red zone.',
    build: o => buildStairOpening(1.40, 3.20) },

  { key: 'railing', group: 'Terrace & structure', name: 'Glass railing — 3 m', w: 3.00, d: 0.12, h: 1.10,
    clear: 0, clearDir: 'ring',  seats: 0, kg: 90, spec: '3.00 m run · 1.10 m tall',
    note: 'Minimum 1.1 m tall at this height. Add runs where the parapet is open.', build: o => buildRailing(3.0, o) },

  /* ---- Your images -------------------------------------------------- */
  { key: 'media-panel', group: 'Your images', name: 'Image panel (floor standing)', w: 1.60, d: 0.12, h: 2.00,
    clear: 0, clearDir: 'ring',  seats: 0, kg: 20, media: true, spec: '1.60 × 2.00 m visible face',
    note: 'Select it, then Load image — use it for a mural, signage or a reference shot of furniture you are considering.',
    build: o => buildMediaPanel(1.60, 2.00, o) },

  { key: 'media-wall', group: 'Your images', name: 'Wall art / mural (mounted)', w: 2.20, d: 0.08, h: 1.40,
    clear: 0, clearDir: 'ring', overhead: true,  seats: 0, kg: 15, media: true, spec: '2.20 × 1.40 m · hung at 0.9 m',
    note: 'Mounted at 0.9 m. Load a photo of the artwork you are quoting for.',
    build: o => buildMediaPanel(2.20, 1.40, { ...o, floor: false }) },

  { key: 'media-floor', group: 'Your images', name: 'Floor decal / tile sample', w: 2.00, d: 2.00, h: 0.01,
    clear: 0, clearDir: 'ring',  seats: 0, kg: 2, media: true, flat: true, spec: '2.00 × 2.00 m',
    note: 'Load a photo of a tile or deck sample to see it at real scale underfoot.',
    build: o => buildRug(2.00, 2.00, { tone: 'linen' }) },

  /* ---- Zones -------------------------------------------------------- */
  { key: 'zone', group: 'Zones', name: 'Zone marker', w: 3.00, d: 3.00, h: 0.01,
    clear: 0, clearDir: 'ring',  seats: 0, kg: 0, flat: true, zone: true, spec: 'Resizable label',
    note: 'Drop one over an area and rename it — Pool, Lounge, PS5, Bar. Costs nothing, reads instantly on the plan.',
    build: () => group() },
];

export const BY_KEY = Object.fromEntries(CATALOG.map(c => [c.key, c]));
