import { BY_KEY } from './catalog.js';

export const WALKWAY = 0.90;   // gap a person can pass through
export const ROUTE    = 1.20;  // primary circulation / escape route

export const dimsOf = it => {
  const d = BY_KEY[it.key] || {};
  return { w: it.w ?? d.w ?? 1, d: it.d ?? d.d ?? 1, def: d };
};

/* Footprint as an oriented box in the floor plane. */
export function obbOf(it) {
  const { w, d } = dimsOf(it);
  return { cx: it.x, cz: it.z, rot: it.rot || 0, ex: w / 2, ez: d / 2 };
}

/* The clearance box: how far the item's working space reaches, and which way.
   'ring' grows every side, 'front'/'back' grow one side only along local Z,
   'ends' grows both sides along local X. */
export function clearBox(it) {
  const { w, d, def } = dimsOf(it);
  const m = def.clear || 0;
  if (!m) return null;
  const dir = def.clearDir || 'ring';
  let ex = w / 2, ez = d / 2, offZ = 0;
  if (dir === 'ring') { ex += m; ez += m; }
  else if (dir === 'ends') { ex += m; }
  else { ez += m / 2; offZ = (dir === 'front' ? 1 : -1) * m / 2; }
  const s = Math.sin(it.rot || 0), c = Math.cos(it.rot || 0);
  return { cx: it.x + -s * offZ, cz: it.z + c * offZ, rot: it.rot || 0, ex, ez, localOffZ: offZ, dir, m };
}

const axesOf = o => {
  const c = Math.cos(o.rot), s = Math.sin(o.rot);
  return [{ x: c, z: s }, { x: -s, z: c }];
};

export const cornersOf = o => {
  const [u, v] = axesOf(o);
  const out = [];
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]])
    out.push({ x: o.cx + u.x * o.ex * sx + v.x * o.ez * sz, z: o.cz + u.z * o.ex * sx + v.z * o.ez * sz });
  return out;
};

/* Separation along the four candidate axes. <= 0 means the boxes overlap. */
export function separation(a, b) {
  let best = -Infinity;
  for (const ax of [...axesOf(a), ...axesOf(b)]) {
    const proj = o => cornersOf(o).map(p => p.x * ax.x + p.z * ax.z);
    const pa = proj(a), pb = proj(b);
    const gap = Math.max(Math.min(...pb) - Math.max(...pa), Math.min(...pa) - Math.max(...pb));
    if (gap > best) best = gap;
  }
  return best;
}

export const overlaps = (a, b) => separation(a, b) < -0.005;

/* How far the box pokes past the terrace edge, in metres. */
export function outsideBy(o, room) {
  let m = 0;
  for (const p of cornersOf(o)) m = Math.max(m, Math.abs(p.x) - room.w / 2, Math.abs(p.z) - room.d / 2);
  return m;
}

/* A pinch point only matters between things you cannot step around: a wall of
   furniture, not a chair or a speaker you walk past. */
const bulky = it => {
  const { w, d, def } = dimsOf(it);
  const area = w * d;
  return ((def.h || 0) >= 1.0 && area >= 0.8) || area >= 1.5;
};

export function analyse(items, room) {
  const issues = [];
  const nameOf = i => i.label || (BY_KEY[i.key] || {}).name || i.key;
  const solid = items.filter(i => {
    const d = BY_KEY[i.key] || {};
    return !d.flat && !d.zone && !d.overhead;
  });

  const push = (level, ids, msg) => issues.push({ level, ids, msg });

  for (const it of items) {
    const def = BY_KEY[it.key] || {};
    if (def.zone) continue;
    const over = outsideBy(obbOf(it), room);
    if (over > 0.02) push('clash', [it.id], `${nameOf(it)} hangs ${over.toFixed(2)} m past the terrace edge.`);
  }

  for (let i = 0; i < solid.length; i++) for (let j = i + 1; j < solid.length; j++) {
    const A = solid[i], B = solid[j];
    const a = obbOf(A), b = obbOf(B);
    const sep = separation(a, b);

    if (sep < -0.005) { push('clash', [A.id, B.id], `${nameOf(A)} overlaps ${nameOf(B)}.`); continue; }

    let flagged = false;
    for (const [X, Y, ox, oy] of [[A, B, a, b], [B, A, b, a]]) {
      const cb = clearBox(X);
      if (!cb) continue;
      const def = BY_KEY[X.key];
      // soft clearances (leg room, walk-by) only matter against things you
      // cannot step around; hard ones (cue swing, staff aisle) matter always.
      if (!def.hard && !bulky(Y)) continue;
      const s2 = separation(cb, oy);
      if (s2 < -0.02) {
        push('tight', [X.id, Y.id],
          `${nameOf(Y)} sits inside the ${(def.clearNote || `${def.clear} m clearance`).toLowerCase()} of ${nameOf(X)} — ${sep.toFixed(2)} m clear, needs ${def.clear.toFixed(2)} m.`);
        flagged = true; break;
      }
    }
    if (flagged) continue;

    if (bulky(A) && bulky(B) && sep > 0.05 && sep < WALKWAY)
      push('tight', [A.id, B.id], `${sep.toFixed(2)} m pinch between ${nameOf(A)} and ${nameOf(B)} — people need ${WALKWAY.toFixed(2)} m.`);
  }

  /* clearance running into the parapet — only for the hard ones. A sofa with
     its front near the wall is a choice; a cue swing into the wall is not. */
  for (const it of solid) {
    const def0 = BY_KEY[it.key] || {};
    if (!def0.hard || it.key === 'stair') continue;   // the stair opening sits at the edge by design
    const cb = clearBox(it);
    if (!cb) continue;
    const over = outsideBy(cb, room);
    const def = BY_KEY[it.key];
    if (over > 0.02) push('tight', [it.id],
      `${nameOf(it)} is ${over.toFixed(2)} m short against the parapet — ${(def.clearNote || 'needs more room').toLowerCase()}.`);
  }

  /* the stair landing is the escape route — nothing parks in it */
  for (const st of items.filter(i => i.key === 'stair')) {
    const zone = { ...obbOf(st) };
    zone.ex += ROUTE; zone.ez += ROUTE;
    for (const it of solid) {
      if (it.id === st.id) continue;
      if (separation(zone, obbOf(it)) < 0)
        push('clash', [it.id, st.id], `${nameOf(it)} blocks the ${ROUTE.toFixed(1)} m escape route at the stair.`);
    }
  }

  /* totals */
  let seats = 0, standing = 0, kg = 0, used = 0;
  for (const it of items) {
    const { w, d, def } = dimsOf(it);
    if (def.zone) continue;
    seats += def.seats || 0;
    kg += def.kg || 0;
    if (it.key === 'cocktail') standing += 4;
    if (it.key === 'bar24') standing += 4;
    if (it.key === 'bar36') standing += 6;
    if (!def.flat && !def.overhead) used += w * d;
  }
  const area = room.w * room.d;
  const heaviest = items.map(i => ({ it: i, kg: (BY_KEY[i.key] || {}).kg || 0 }))
                        .sort((a, b) => b.kg - a.kg)[0];

  const rank = { clash: 0, tight: 1 };
  issues.sort((a, b) => rank[a.level] - rank[b.level]);

  return {
    issues, seats, standing, kg, area, used,
    free: Math.max(0, 1 - used / area),
    load: area ? kg / area : 0,
    heaviest: heaviest && heaviest.kg > 0 ? heaviest : null,
    clashes: issues.filter(i => i.level === 'clash').length,
    tights: issues.filter(i => i.level === 'tight').length,
  };
}
