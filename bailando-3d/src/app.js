import { THREE, MATS } from './lib.js';
import { CATALOG, BY_KEY, GROUPS } from './catalog.js';
import { Stage, FLOOR_KEYS, MOOD_KEYS } from './scene.js';
import { analyse, obbOf, clearBox, cornersOf, dimsOf, WALKWAY, ROUTE } from './checks.js';
import { PRESETS } from './presets.js';

const $ = s => document.querySelector(s);
const el = (t, cls, txt) => { const n = document.createElement(t); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };
const fmt = n => (Math.round(n * 100) / 100).toFixed(2);
const feet = m => { const t = m * 3.28084; const f = Math.floor(t); return `${f}′${Math.round((t - f) * 12)}″`; };
const KEY = 'bailando.terrace.v1';

let uid = 1;
const state = {
  room: { w: 14, d: 9, parapetH: 1.10, openAir: true, wallH: 3.2, floor: 'terrazzo' },
  items: [], sel: null,
  view: 'orbit', mood: 'night',
  showClear: true, showLabels: true,
};
let report = null;
const history = [];

/* ---------- state plumbing ------------------------------------------ */
const snapshot = () => JSON.stringify({ room: state.room, items: state.items });
function commit(label) {
  history.push(snapshot());
  if (history.length > 80) history.shift();
  save(); refresh(label);
}
function undo() {
  const prev = history.pop();
  if (!prev) return toast('Nothing left to undo');
  const s = JSON.parse(prev);
  state.room = s.room; state.items = s.items;
  if (!state.items.some(i => i.id === state.sel)) state.sel = null;
  stage.buildRoom(state.room); save(); refresh();
}
function save() {
  try { localStorage.setItem(KEY, snapshot()); } catch { /* quota — layout still lives in the session */ }
}
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    if (!s.items) return false;
    state.room = { ...state.room, ...s.room };
    state.items = s.items;
    uid = Math.max(1, ...state.items.map(i => (+String(i.id).replace(/\D/g, '') || 0))) + 1;
    return true;
  } catch { return false; }
}

function addItem(key, at) {
  const def = BY_KEY[key];
  if (!def) return;
  history.push(snapshot());
  const it = {
    id: 'i' + (uid++), key, rot: 0,
    x: at ? at.x : 0, z: at ? at.z : 0,
    w: def.w, d: def.d,
    tone: def.tone, wood: def.wood,
    label: def.zone ? 'Zone' : '',
  };
  // drop it somewhere it does not immediately collide
  if (!at) placeFree(it);
  state.items.push(it);
  state.sel = it.id;
  save(); refresh(`Added ${def.name}`);
}

/* Spiral outward from the centre until the footprint sits clear. */
function placeFree(it) {
  const step = 0.6;
  for (let r = 0; r < 40; r++) {
    for (let a = 0; a < Math.max(1, r * 6); a++) {
      const ang = a / Math.max(1, r * 6) * Math.PI * 2;
      it.x = Math.cos(ang) * r * step; it.z = Math.sin(ang) * r * step;
      const o = obbOf(it);
      if (Math.abs(it.x) + o.ex > state.room.w / 2 - 0.1) continue;
      if (Math.abs(it.z) + o.ez > state.room.d / 2 - 0.1) continue;
      const hit = state.items.some(other => {
        const od = BY_KEY[other.key] || {};
        if (od.flat || od.zone || od.overhead) return false;
        const s = obbOf(other);
        return Math.hypot(s.cx - it.x, s.cz - it.z) < (Math.max(s.ex, s.ez) + Math.max(o.ex, o.ez)) * 0.95;
      });
      if (!hit) return;
    }
  }
  it.x = 0; it.z = 0;
}

const selected = () => state.items.find(i => i.id === state.sel) || null;

function removeItem(id) {
  history.push(snapshot());
  const it = state.items.find(i => i.id === id);
  state.items = state.items.filter(i => i.id !== id);
  if (state.sel === id) state.sel = null;
  save(); refresh(it ? `Removed ${BY_KEY[it.key].name}` : '');
}

function duplicate(id) {
  const src = state.items.find(i => i.id === id);
  if (!src) return;
  history.push(snapshot());
  const copy = { ...src, id: 'i' + (uid++), x: src.x + 0.5, z: src.z + 0.5, media: src.media };
  state.items.push(copy); state.sel = copy.id;
  save(); refresh('Duplicated');
}

/* ---------- scene ---------------------------------------------------- */
const stage = new Stage($('#view'));
const nodes = new Map();          // item id -> { root, sig, video }

const sigOf = it => [it.key, it.tone, it.wood, fmt(it.w), fmt(it.d), it.media && it.media.url, it.model && it.model.url].join('|');

function syncScene() {
  for (const [id, n] of nodes) {
    if (!state.items.some(i => i.id === id)) {
      stage.items.remove(n.root);
      if (n.video) { n.video.pause(); n.video.src = ''; }
      nodes.delete(id);
    }
  }
  for (const it of state.items) {
    const def = BY_KEY[it.key];
    if (!def) continue;
    const sig = sigOf(it);
    let n = nodes.get(it.id);
    if (!n || n.sig !== sig) {
      if (n) { stage.items.remove(n.root); if (n.video) { n.video.pause(); n.video.src = ''; } }
      const root = new THREE.Group();
      let body;
      if (it.model) {
        const rec = modelCache.get(it.model.url);
        if (rec) {
          body = rec.scene.clone(true);
          body.scale.set(it.w / rec.w, Math.min(it.w / rec.w, it.d / rec.d), it.d / rec.d);
        } else {
          // still loading — stand a placeholder box in its place
          body = new THREE.Group();
          body.add(new THREE.Mesh(new THREE.BoxGeometry(it.w, it.model.h || 1, it.d),
            new THREE.MeshStandardMaterial({ color: 0x57c7e8, transparent: true, opacity: 0.3 })));
          body.children[0].position.y = (it.model.h || 1) / 2;
          loadModel(it.model.url).then(() => { nodes.delete(it.id); syncScene(); }).catch(() => {});
        }
      } else {
        body = def.build({ tone: it.tone, wood: it.wood });
        // scale non-uniformly if the user resized a resizable item
        if (def.w && it.w && Math.abs(it.w - def.w) > 0.001) body.scale.x = it.w / def.w;
        if (def.d && it.d && Math.abs(it.d - def.d) > 0.001) body.scale.z = it.d / def.d;
      }
      root.add(body);
      root.traverse(o => {
        o.userData.itemId = it.id;
        if (o.material && o.material.emissiveIntensity !== undefined && o.userData.baseEmissive === undefined)
          o.userData.baseEmissive = o.material.emissiveIntensity;
      });
      n = { root, sig, screen: body.userData.screen || findScreen(body), video: null };
      if (it.media) applyMedia(n, it.media);
      stage.items.add(root);
      nodes.set(it.id, n);
    }
    n.root.position.set(it.x, 0, it.z);
    n.root.rotation.y = it.rot || 0;
  }
  stage.setMood(stage.mood);
}

function findScreen(g) { let f = null; g.traverse(o => { if (!f && o.userData && o.userData.isScreen) f = o; }); return f; }

function applyMedia(n, media) {
  if (!n.screen) return;
  let tex;
  if (media.type === 'video') {
    const v = document.createElement('video');
    v.src = media.url; v.loop = true; v.muted = true; v.playsInline = true; v.autoplay = true;
    v.play().catch(() => {});
    tex = new THREE.VideoTexture(v);
    n.video = v;
  } else {
    tex = new THREE.TextureLoader().load(media.url);
  }
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = n.screen.material;
  m.map = tex; m.color.setHex(0xffffff);
  if (m.emissive) { m.emissive.setHex(0xffffff); m.emissiveMap = tex; m.emissiveIntensity = 0.9; n.screen.userData.baseEmissive = 0.9; }
  m.needsUpdate = true;
}

/* ---------- floor overlays: clearances, selection, zones -------------- */
const flatShape = (ex, ez, hole) => {
  const s = new THREE.Shape();
  s.moveTo(-ex, -ez); s.lineTo(ex, -ez); s.lineTo(ex, ez); s.lineTo(-ex, ez); s.closePath();
  if (hole) {
    const h = new THREE.Path();
    h.moveTo(-hole.ex, -hole.ez); h.lineTo(-hole.ex, hole.ez); h.lineTo(hole.ex, hole.ez); h.lineTo(hole.ex, -hole.ez); h.closePath();
    s.holes.push(h);
  }
  return s;
};

function flatMesh(shape, color, opacity, y, it, offZ = 0) {
  const g = new THREE.ShapeGeometry(shape);
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide,
  }));
  m.renderOrder = 3;
  const s = Math.sin(it.rot || 0), c = Math.cos(it.rot || 0);
  m.position.set(it.x + -s * offZ, y, it.z + c * offZ);
  m.rotation.y = it.rot || 0;
  return m;
}

function outlineMesh(ex, ez, color, y, it, offZ = 0, t = 0.03) {
  const shape = flatShape(ex + t, ez + t, { ex, ez });
  return flatMesh(shape, color, 0.95, y, it, offZ);
}

const COL = { cyan: 0x57c7e8, rosa: 0xff5c7a, warn: 0xf3b03c, bad: 0xff5566, ok: 0x4cc38a };

function buildOverlay() {
  stage.overlay.clear();
  const flagged = new Map();
  if (report) for (const is of report.issues) for (const id of is.ids)
    if (is.level === 'clash' || !flagged.has(id)) flagged.set(id, is.level);

  for (const it of state.items) {
    const def = BY_KEY[it.key];
    if (!def) continue;
    const o = obbOf(it);
    const lvl = flagged.get(it.id);
    const tint = lvl === 'clash' ? COL.bad : lvl === 'tight' ? COL.warn : COL.cyan;

    if (def.zone) {
      stage.overlay.add(flatMesh(flatShape(o.ex, o.ez), COL.rosa, 0.09, 0.008, it));
      stage.overlay.add(outlineMesh(o.ex, o.ez, COL.rosa, 0.010, it, 0, 0.035));
      continue;
    }

    if (state.showClear) {
      const cb = clearBox(it);
      if (cb) {
        stage.overlay.add(flatMesh(flatShape(cb.ex, cb.ez, { ex: o.ex, ez: o.ez }), tint, lvl ? 0.20 : 0.10, 0.012, it, cb.localOffZ));
        stage.overlay.add(outlineMesh(cb.ex, cb.ez, tint, 0.013, it, cb.localOffZ, 0.022));
      }
      // viewing distance cone for screens
      if (def.view) {
        const [near, far] = def.view;
        const s = new THREE.Shape();
        const nw = o.ex * 1.1, fw = o.ex * 2.3;
        s.moveTo(-nw, near); s.lineTo(nw, near); s.lineTo(fw, far); s.lineTo(-fw, far); s.closePath();
        const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2);
        const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: COL.cyan, transparent: true, opacity: 0.11, depthWrite: false, side: THREE.DoubleSide }));
        m.position.set(it.x, 0.011, it.z); m.rotation.y = it.rot || 0; m.renderOrder = 3;
        stage.overlay.add(m);
      }
    }

    if (lvl && !state.showClear) stage.overlay.add(outlineMesh(o.ex, o.ez, tint, 0.016, it, 0, 0.03));

    if (it.id === state.sel) {
      stage.overlay.add(flatMesh(flatShape(o.ex, o.ez), COL.rosa, 0.16, 0.017, it));
      stage.overlay.add(outlineMesh(o.ex, o.ez, COL.rosa, 0.018, it, 0, 0.045));
    }
  }
}

/* ---------- SVG overlay: dimensions and labels ------------------------ */
const V = new THREE.Vector3();
let rect = { width: 1, height: 1 };
function proj(x, y, z) {
  V.set(x, y, z).project(stage.camera);
  return [(V.x * 0.5 + 0.5) * rect.width, (-V.y * 0.5 + 0.5) * rect.height];
}
const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

function dimLine(ax, az, bx, bz, text, color) {
  const [x1, y1] = proj(ax, 0, az), [x2, y2] = proj(bx, 0, bz);
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const nx = (y2 - y1), ny = -(x2 - x1), len = Math.hypot(nx, ny) || 1;
  const tw = text.length * 6.6 + 12;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.1" stroke-dasharray="5 4" opacity=".85"/>
    <circle cx="${x1}" cy="${y1}" r="2.4" fill="${color}"/><circle cx="${x2}" cy="${y2}" r="2.4" fill="${color}"/>
    <rect x="${mx - tw / 2}" y="${my - 9}" width="${tw}" height="18" rx="4" fill="#0b0d13" opacity=".82"/>
    <text x="${mx}" y="${my + 4}" fill="${color}" font-family="IBM Plex Mono, monospace" font-size="11.5"
      text-anchor="middle">${esc(text)}</text>`;
}

function drawOverlay() {
  const svg = $('#ovl');
  const r = state.room;
  let out = '';

  if (state.view === 'plan') {
    const off = 0.55;
    out += dimLine(-r.w / 2, r.d / 2 + off, r.w / 2, r.d / 2 + off, `${fmt(r.w)} m  ·  ${feet(r.w)}`, '#57C7E8');
    out += dimLine(-r.w / 2 - off, -r.d / 2, -r.w / 2 - off, r.d / 2, `${fmt(r.d)} m  ·  ${feet(r.d)}`, '#57C7E8');

    const sel = selected();
    if (sel) {
      const o = obbOf(sel);
      const cs = cornersOf(o);
      const minX = Math.min(...cs.map(p => p.x)), maxX = Math.max(...cs.map(p => p.x));
      const minZ = Math.min(...cs.map(p => p.z)), maxZ = Math.max(...cs.map(p => p.z));
      const gaps = [
        [-r.w / 2, sel.z, minX, sel.z, minX + r.w / 2],
        [maxX, sel.z, r.w / 2, sel.z, r.w / 2 - maxX],
        [sel.x, -r.d / 2, sel.x, minZ, minZ + r.d / 2],
        [sel.x, maxZ, sel.x, r.d / 2, r.d / 2 - maxZ],
      ];
      for (const [ax, az, bx, bz, v] of gaps)
        if (v > 0.04) out += dimLine(ax, az, bx, bz, `${fmt(v)} m`, '#FF5C7A');
    }
  }

  if (state.showLabels && state.view !== 'walk') {
    // Nearest label wins its patch of screen; anything that would collide with
    // one already placed is dropped, so the view never turns into a pile of tags.
    const cam = stage.camera.position;
    const cand = state.items.map(it => {
      const def = BY_KEY[it.key];
      if (!def) return null;
      const top = state.view === 'plan' ? 0 : (def.h || 0.8) + 0.12;
      const [x, y] = proj(it.x, top, it.z);
      if (x < -80 || y < -40 || x > rect.width + 80 || y > rect.height + 40) return null;
      const txt = it.label || def.name.replace(/ —.*/, '');
      const sub = `${fmt(it.w ?? def.w)}×${fmt(it.d ?? def.d)}`;
      const w = Math.max(txt.length * 6.4, sub.length * 6.4) + 16;
      return { it, x, y, w, txt, sub, on: it.id === state.sel,
               dist: Math.hypot(cam.x - it.x, cam.z - it.z) };
    }).filter(Boolean);
    cand.sort((a, b) => (b.on - a.on) || (a.dist - b.dist));

    const placed = [];
    for (const c of cand) {
      const bx = c.x - c.w / 2, by = c.y - 19;
      if (!c.on && placed.some(p => bx < p.x + p.w + 4 && bx + c.w + 4 > p.x && by < p.y + 36 && by + 36 > p.y)) continue;
      placed.push({ x: bx, y: by, w: c.w });
      out += `<g opacity="${c.on ? 1 : .8}">
        <rect x="${bx}" y="${by}" width="${c.w}" height="32" rx="5"
          fill="${c.on ? '#2a1420' : '#0b0d13'}" opacity=".9" stroke="${c.on ? '#FF5C7A' : '#333C55'}"/>
        <text x="${c.x}" y="${c.y - 6}" fill="${c.on ? '#FF5C7A' : '#E9E6DF'}" font-family="IBM Plex Sans, sans-serif"
          font-size="11.5" text-anchor="middle">${esc(c.txt)}</text>
        <text x="${c.x}" y="${c.y + 7}" fill="#8B93A9" font-family="IBM Plex Mono, monospace"
          font-size="10" text-anchor="middle">${esc(c.sub)}</text></g>`;
    }
  }
  svg.innerHTML = out;
}

/* ---------- camera + pointer ------------------------------------------ */
const ray = new THREE.Raycaster();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hitPoint = new THREE.Vector3();
let drag = null, orbiting = null;
const keys = new Set();

function ndc(e) {
  return new THREE.Vector2(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
}
function floorAt(e) {
  ray.setFromCamera(ndc(e), stage.camera);
  return ray.ray.intersectPlane(plane, hitPoint) ? hitPoint.clone() : null;
}
function pickItem(e) {
  ray.setFromCamera(ndc(e), stage.camera);
  const hits = ray.intersectObjects(stage.items.children, true);
  for (const h of hits) {
    let o = h.object;
    while (o && !o.userData.itemId) o = o.parent;
    if (o) return o.userData.itemId;
  }
  return null;
}

const canvas = $('#view');
canvas.addEventListener('pointerdown', e => {
  rect = $('#stage').getBoundingClientRect();
  canvas.setPointerCapture(e.pointerId);
  if (state.view === 'walk') { canvas.requestPointerLock && canvas.requestPointerLock(); return; }

  const pan = e.button === 2 || e.button === 1 || keys.has(' ');
  if (!pan && e.button === 0) {
    const id = pickItem(e);
    if (id) {
      state.sel = id;
      const it = state.items.find(i => i.id === id);
      const p = floorAt(e);
      history.push(snapshot());
      drag = { id, ox: p ? it.x - p.x : 0, oz: p ? it.z - p.z : 0, moved: false };
      canvas.classList.add('dragging');
      renderInspector(); buildOverlay();
      return;
    }
    state.sel = null; renderInspector(); buildOverlay();
  }
  orbiting = { x: e.clientX, y: e.clientY, pan };
  canvas.classList.add('dragging');
});

canvas.addEventListener('pointermove', e => {
  if (drag) {
    const p = floorAt(e); if (!p) return;
    const it = state.items.find(i => i.id === drag.id); if (!it) return;
    const snap = e.altKey ? 0.01 : 0.05;
    let x = Math.round((p.x + drag.ox) / snap) * snap;
    let z = Math.round((p.z + drag.oz) / snap) * snap;
    // snap flush to the parapet when close
    const o = obbOf({ ...it, x, z });
    const r = state.room;
    if (Math.abs(-r.w / 2 - (x - o.ex)) < 0.22) x = -r.w / 2 + o.ex;
    if (Math.abs(r.w / 2 - (x + o.ex)) < 0.22) x = r.w / 2 - o.ex;
    if (Math.abs(-r.d / 2 - (z - o.ez)) < 0.22) z = -r.d / 2 + o.ez;
    if (Math.abs(r.d / 2 - (z + o.ez)) < 0.22) z = r.d / 2 - o.ez;
    it.x = x; it.z = z; drag.moved = true;
    recompute(); syncScene(); buildOverlay(); renderInspector();
    return;
  }
  if (!orbiting) return;
  const dx = e.clientX - orbiting.x, dy = e.clientY - orbiting.y;
  orbiting.x = e.clientX; orbiting.y = e.clientY;
  const o = stage.orbit;
  if (state.view === 'plan') {
    const k = stage.planZoom / rect.height * 2;
    o.target.x -= dx * k; o.target.z -= dy * k;
  } else if (orbiting.pan) {
    const k = o.radius / rect.height * 1.1;
    const right = new THREE.Vector3().setFromMatrixColumn(stage.cam3d.matrix, 0);
    const fwd = new THREE.Vector3(-right.z, 0, right.x);
    o.target.addScaledVector(right, -dx * k).addScaledVector(fwd, -dy * k);
  } else {
    o.theta -= dx * 0.006;
    o.phi = Math.min(Math.PI / 2 - 0.03, Math.max(0.10, o.phi - dy * 0.005));
  }
});

const endPointer = () => {
  if (drag && drag.moved) commit(''); else if (drag) { history.pop(); }
  drag = null; orbiting = null;
  canvas.classList.remove('dragging');
};
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('contextmenu', e => e.preventDefault());

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const f = Math.exp(e.deltaY * 0.0011);
  if (state.view === 'plan') { stage.planZoom = Math.min(60, Math.max(2, stage.planZoom * f)); stage.updatePlanCam(); }
  else stage.orbit.radius = Math.min(90, Math.max(1.6, stage.orbit.radius * f));
}, { passive: false });

document.addEventListener('mousemove', e => {
  if (state.view !== 'walk' || document.pointerLockElement !== canvas) return;
  stage.walk.yaw -= e.movementX * 0.0026;
  stage.walk.pitch = Math.max(-1.2, Math.min(1.2, stage.walk.pitch - e.movementY * 0.0022));
});

/* ---------- keyboard --------------------------------------------------- */
const NUDGE = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
addEventListener('keydown', e => {
  if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
  keys.add(e.key.length === 1 ? e.key.toLowerCase() : e.key);
  const it = selected();

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); return undo(); }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') { e.preventDefault(); return it && duplicate(it.id); }
  if (e.key === 'Escape') { state.sel = null; document.exitPointerLock && document.exitPointerLock(); return refresh(); }
  if (!it) return;

  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); return removeItem(it.id); }
  if (e.key.toLowerCase() === 'r') {
    history.push(snapshot());
    it.rot = (it.rot || 0) + (e.shiftKey ? -1 : 1) * Math.PI / 12;
    return commit('');
  }
  if (NUDGE[e.key]) {
    e.preventDefault();
    const [dx, dz] = NUDGE[e.key], s = e.shiftKey ? 0.5 : 0.05;
    history.push(snapshot());
    it.x += dx * s; it.z += dz * s;
    return commit('');
  }
});
addEventListener('keyup', e => keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key));

/* ---------- walk movement --------------------------------------------- */
function stepWalk(dt) {
  const w = stage.walk;
  const speed = (keys.has('Shift') ? 3.4 : 1.7) * dt;
  let f = 0, s = 0;
  if (keys.has('w') || keys.has('ArrowUp')) f += 1;
  if (keys.has('s') || keys.has('ArrowDown')) f -= 1;
  if (keys.has('a') || keys.has('ArrowLeft')) s -= 1;
  if (keys.has('d') || keys.has('ArrowRight')) s += 1;
  if (!f && !s) return;
  const nx = w.pos.x + (-Math.sin(w.yaw) * f + Math.cos(w.yaw) * s) * speed;
  const nz = w.pos.z + (-Math.cos(w.yaw) * f - Math.sin(w.yaw) * s) * speed;
  const r = state.room, m = 0.34;
  const free = (x, z) => !state.items.some(it => {
    const def = BY_KEY[it.key] || {};
    if (def.flat || def.zone || def.overhead || (def.h || 0) < 0.5) return false;
    const o = obbOf(it);
    const dx = x - o.cx, dz = z - o.cz, c = Math.cos(-it.rot || 0), si = Math.sin(-it.rot || 0);
    return Math.abs(dx * c - dz * si) < o.ex + m && Math.abs(dx * si + dz * c) < o.ez + m;
  });
  if (free(nx, w.pos.z)) w.pos.x = Math.max(-r.w / 2 + m, Math.min(r.w / 2 - m, nx));
  if (free(w.pos.x, nz)) w.pos.z = Math.max(-r.d / 2 + m, Math.min(r.d / 2 - m, nz));
}

/* ---------- custom .glb models ---------------------------------------- */
const modelCache = new Map();   // url -> { scene, w, d, h }

async function loadModel(url) {
  if (modelCache.has(url)) return modelCache.get(url);
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const gltf = await new GLTFLoader().loadAsync(url);
  const s = gltf.scene;
  s.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  const bb = new THREE.Box3().setFromObject(s);
  const size = bb.getSize(new THREE.Vector3());
  const centre = bb.getCenter(new THREE.Vector3());
  s.position.sub(new THREE.Vector3(centre.x, bb.min.y, centre.z));   // sit on the floor, centred
  const rec = { scene: s, w: +size.x.toFixed(3) || 1, d: +size.z.toFixed(3) || 1, h: +size.y.toFixed(3) || 1 };
  modelCache.set(url, rec);
  return rec;
}

async function addModelFile(file) {
  const url = URL.createObjectURL(file);
  try {
    const rec = await loadModel(url);
    // scale a wildly-sized import to something plausible before it lands
    let k = 1;
    const big = Math.max(rec.w, rec.d, rec.h);
    if (big > 6) k = 3 / big; else if (big < 0.25) k = 1 / big;
    history.push(snapshot());
    const it = {
      id: 'i' + (uid++), key: 'custom', rot: 0, x: 0, z: 0,
      w: +(rec.w * k).toFixed(2) || 1, d: +(rec.d * k).toFixed(2) || 1,
      model: { url, name: file.name, h: rec.h * k },
      label: file.name.replace(/\.glb$/i, ''),
    };
    placeFree(it);
    state.items.push(it); state.sel = it.id;
    save(); refresh(`Loaded ${file.name} — ${fmt(it.w)} × ${fmt(it.d)} m. Correct the size if it came in wrong.`);
  } catch (err) {
    toast(`Could not read ${file.name}. It needs to be a .glb file.`);
  }
}

/* ---------- panels ----------------------------------------------------- */
function buildRail(filter = '') {
  const host = $('#picks'); host.innerHTML = '';
  const f = filter.trim().toLowerCase();
  for (const g of GROUPS) {
    const items = CATALOG.filter(c => c.group === g && !c.custom &&
      (!f || (c.name + ' ' + (c.spec || '') + ' ' + g).toLowerCase().includes(f)));
    if (!items.length) continue;
    host.appendChild(el('div', 'grouphead', g));
    for (const c of items) {
      const b = el('button', 'pick');
      b.appendChild(el('span', 'nm', c.name));
      b.appendChild(el('span', 'dm', c.spec || `${fmt(c.w)} × ${fmt(c.d)} m`));
      b.title = c.note || c.name;
      b.onclick = () => addItem(c.key);
      host.appendChild(b);
    }
  }
  if (!host.children.length) host.appendChild(el('div', 'empty', `Nothing matches “${filter}”.`));
}

function numField(label, value, step, on, suffix) {
  const f = el('div', 'field');
  const id = 'f' + Math.random().toString(36).slice(2, 7);
  const l = el('label', null, label); l.htmlFor = id;
  const i = document.createElement('input');
  i.type = 'number'; i.step = step; i.value = value; i.id = id;
  i.onchange = () => on(parseFloat(i.value));
  f.append(l, i);
  if (suffix) f.appendChild(el('span', null, suffix));
  return f;
}

function renderInspector() {
  const host = $('#insp'); host.innerHTML = '';
  const it = selected();
  if (!it) {
    const e = el('div', 'empty');
    e.innerHTML = `<b>Nothing selected</b>Click anything in the terrace to select it.
      <ul><li>Drag to move — it snaps to 5 cm and goes flush to the parapet</li>
      <li><kbd>R</kbd> rotates, arrow keys nudge, <kbd>Delete</kbd> removes</li>
      <li>Pick <b>Walk</b> above the view to stand in the space</li></ul>`;
    host.appendChild(e);
    return;
  }
  const def = BY_KEY[it.key];
  const s = el('div', 'sect');
  s.appendChild(el('h3', null, it.label || def.name));
  s.appendChild(el('div', 'spec', it.model ? `${fmt(it.w)} × ${fmt(it.d)} m · imported model` : def.spec || ''));
  if (def.note) { const n = el('p', 'note', def.note); s.appendChild(n); }
  if (def.kg) s.appendChild(el('div', 'spec', `Approx. ${def.kg} kg`));

  const g1 = el('div', 'rowgrid');
  g1.append(
    numField('Across (x)', fmt(it.x), 0.05, v => { history.push(snapshot()); it.x = v; commit(''); }),
    numField('Along (z)', fmt(it.z), 0.05, v => { history.push(snapshot()); it.z = v; commit(''); }),
    numField('Width m', fmt(it.w), 0.05, v => { history.push(snapshot()); it.w = Math.max(0.2, v); commit(''); }),
    numField('Depth m', fmt(it.d), 0.05, v => { history.push(snapshot()); it.d = Math.max(0.2, v); commit(''); }),
  );
  s.appendChild(g1);

  const rotRow = el('div', 'rowgrid');
  const rf = el('div', 'field');
  rf.appendChild(el('label', null, 'Rotation'));
  const rr = document.createElement('input');
  rr.type = 'range'; rr.min = 0; rr.max = 355; rr.step = 5;
  rr.value = Math.round(((it.rot || 0) * 180 / Math.PI + 360) % 360 / 5) * 5;
  rr.oninput = () => { it.rot = (+rr.value) * Math.PI / 180; recompute(); syncScene(); buildOverlay(); };
  rr.onchange = () => commit('');
  rf.appendChild(rr);
  const qf = el('div', 'field');
  qf.appendChild(el('label', null, 'Quarter turns'));
  const qb = el('div'); qb.style.display = 'flex'; qb.style.gap = '4px';
  for (const deg of [0, 90, 180, 270]) {
    const b = el('button', 'btn', deg + '°');
    b.style.padding = '4px 7px'; b.style.flex = '1';
    b.onclick = () => { history.push(snapshot()); it.rot = deg * Math.PI / 180; commit(''); };
    qb.appendChild(b);
  }
  qf.appendChild(qb);
  rotRow.append(rf, qf);
  s.appendChild(rotRow);

  const opts = el('div', 'rowgrid');
  if (def.tone) opts.appendChild(selField('Colour', ['tan', 'black', 'rose', 'teal', 'linen', 'ivory'], it.tone, v => { history.push(snapshot()); it.tone = v; commit(''); }));
  if (def.wood) opts.appendChild(selField('Timber', ['walnut', 'oak', 'teak', 'black'], it.wood, v => { history.push(snapshot()); it.wood = v; commit(''); }));
  if (it.key.startsWith('pool')) opts.appendChild(selField('Cloth', ['green', 'blue', 'red'], it.tone, v => { history.push(snapshot()); it.tone = v; commit(''); }));
  if (opts.children.length) s.appendChild(opts);

  const lf = el('div', 'field');
  lf.style.marginTop = '11px'; lf.style.flexDirection = 'column'; lf.style.alignItems = 'stretch'; lf.style.gap = '3px';
  lf.appendChild(el('label', null, 'Label on the plan'));
  const li = document.createElement('input');
  li.type = 'text'; li.value = it.label || ''; li.placeholder = def.name;
  li.onchange = () => { history.push(snapshot()); it.label = li.value; commit(''); };
  lf.appendChild(li);
  s.appendChild(lf);

  const acts = el('div'); acts.style.cssText = 'display:flex;gap:7px;margin-top:12px;flex-wrap:wrap';
  if (def.media || it.model || nodes.get(it.id)?.screen) {
    const b = el('button', 'btn', it.media ? 'Replace image' : 'Load image / video');
    b.onclick = () => { pendingMediaFor = it.id; $('#fileImg').click(); };
    acts.appendChild(b);
  }
  const dup = el('button', 'btn', 'Duplicate'); dup.onclick = () => duplicate(it.id);
  const del = el('button', 'btn', 'Remove'); del.onclick = () => removeItem(it.id);
  del.style.color = 'var(--bad)';
  acts.append(dup, del);
  s.appendChild(acts);
  host.appendChild(s);
}

function selField(label, values, current, on) {
  const f = el('div', 'field');
  f.appendChild(el('label', null, label));
  const sel = document.createElement('select');
  for (const v of values) {
    const o = document.createElement('option');
    o.value = v; o.textContent = v[0].toUpperCase() + v.slice(1);
    if (v === current) o.selected = true;
    sel.appendChild(o);
  }
  sel.onchange = () => on(sel.value);
  f.appendChild(sel);
  return f;
}

function renderFit() {
  const r = report;
  const stats = $('#stats'); stats.innerHTML = '';
  const loadCls = r.load > 400 ? 'bad' : r.load > 200 ? 'warn' : 'ok';
  const freeCls = r.free < 0.35 ? 'bad' : r.free < 0.5 ? 'warn' : 'ok';
  const cards = [
    ['Seated', r.seats, ''],
    ['Standing spots', r.standing, ''],
    ['Free floor', Math.round(r.free * 100) + '%', freeCls],
    ['Added load', Math.round(r.kg) + ' kg', loadCls],
  ];
  for (const [k, v, cls] of cards) {
    const c = el('div', 'stat');
    const vv = el('div', 'v ' + cls, String(v));
    c.append(vv, el('div', 'k', k));
    stats.appendChild(c);
  }

  const host = $('#issues'); host.innerHTML = '';
  if (!r.issues.length) {
    const ok = el('div', 'allclear');
    ok.appendChild(el('div', 'dot'));
    ok.appendChild(el('div', null, state.items.length
      ? 'Everything fits. Clearances, walkways and the stair route are all clear.'
      : 'Empty terrace. Add something from the catalogue on the left.'));
    host.appendChild(ok);
  } else {
    for (const is of r.issues.slice(0, 24)) {
      const b = el('button', 'issue ' + is.level);
      b.appendChild(el('div', 'dot'));
      b.appendChild(el('div', null, is.msg));
      b.onclick = () => { state.sel = is.ids[0]; refresh(); };
      host.appendChild(b);
    }
  }
  if (r.heaviest && r.heaviest.kg >= 300) {
    const w = el('div', 'allclear');
    w.style.color = 'var(--brass)';
    w.appendChild(el('div', 'dot')).style.background = 'var(--brass)';
    w.appendChild(el('div', null, `${BY_KEY[r.heaviest.it.key].name} is about ${r.heaviest.kg} kg on four legs. Get your structural engineer to sign off the slab before ordering.`));
    host.appendChild(w);
  }
}

function renderStatus() {
  const r = state.room, rep = report;
  $('#status').innerHTML = `
    <span><b>Terrace</b> ${fmt(r.w)} × ${fmt(r.d)} m · ${Math.round(r.w * r.d)} m²</span>
    <span><b>Items</b> ${state.items.length}</span>
    <span style="color:${rep.clashes ? 'var(--bad)' : 'var(--dim)'}"><b>Clashes</b> ${rep.clashes}</span>
    <span style="color:${rep.tights ? 'var(--warn)' : 'var(--dim)'}"><b>Tight</b> ${rep.tights}</span>
    <span><b>Load</b> ${Math.round(rep.load)} kg/m²</span>
    <span style="color:var(--dim)">Drag to move · R rotate · Del remove · Ctrl+Z undo</span>`;
}

const HINTS = {
  plan: 'Top-down plan. Select anything to dimension it off all four walls.',
  orbit: 'Drag to orbit · right-drag to pan · scroll to zoom.',
  walk: 'Click the view, then <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> to walk, mouse to look, <kbd>Shift</kbd> to jog, <kbd>Esc</kbd> to leave.',
};

function recompute() { report = analyse(state.items, state.room); }

function refresh(msg) {
  recompute(); syncScene(); buildOverlay();
  renderInspector(); renderFit(); renderStatus();
  $('#hint').innerHTML = HINTS[state.view];
  if (msg) toast(msg);
}

let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 4200);
}

/* ---------- media, export, import -------------------------------------- */
let pendingMediaFor = null;

$('#fileImg').addEventListener('change', async e => {
  const file = e.target.files[0]; e.target.value = '';
  if (!file || !pendingMediaFor) return;
  const it = state.items.find(i => i.id === pendingMediaFor);
  if (!it) return;
  history.push(snapshot());
  if (file.type.startsWith('video/')) {
    it.media = { type: 'video', url: URL.createObjectURL(file), transient: true };
    commit('Video loaded. It plays while this tab is open but is not saved with the layout.');
  } else {
    it.media = { type: 'image', url: await downscale(file) };
    commit('Image applied.');
  }
});

/* Keep stored images small enough to survive in local storage. */
function downscale(file, max = 1400) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => res(null);
    img.src = URL.createObjectURL(file);
  });
}

async function offer(filename, data, mime) {
  try {
    const downloads = await window.claude?.use?.('downloads');
    if (downloads) { await downloads.save({ filename, data }); return true; }
  } catch { /* viewer declined, or downloads unavailable */ }
  return false;
}

async function snapshotPng() {
  const w = stage.renderer.domElement.width, h = stage.renderer.domElement.height;
  stage.renderer.setPixelRatio(Math.min(devicePixelRatio * 1.8, 3));
  stage.renderer.setSize(rect.width, rect.height, false);
  stage.render(state.view);
  const url = stage.renderer.domElement.toDataURL('image/png');
  stage.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  stage.resize(rect.width, rect.height);

  const name = `bailando-${state.view}-${state.mood}.png`;
  if (await offer(name, url)) return toast('Saved.');
  showBlob(`<img src="${url}" alt="Terrace render" style="max-width:100%;border-radius:6px">
    <p style="color:var(--muted);font-size:12.5px;margin:10px 0 0">Right-click the image and choose “Save image as…”.</p>`);
}

async function exportJson() {
  const data = JSON.stringify({ room: state.room, items: state.items.map(i => ({ ...i, media: i.media && i.media.transient ? undefined : i.media })) }, null, 2);
  if (await offer('bailando-layout.json', data)) return toast('Layout saved.');
  showBlob(`<p style="color:var(--muted);font-size:12.5px;margin:0 0 8px">Copy this and send it to whoever needs the layout.</p>
    <textarea readonly style="width:100%;height:230px;background:var(--ink);border:1px solid var(--line2);
    border-radius:6px;padding:9px;font-family:var(--mono);font-size:11.5px;color:var(--text)">${esc(data)}</textarea>`);
}

function showBlob(html) {
  const back = el('div');
  back.style.cssText = `position:fixed;inset:0;background:rgba(5,7,13,.82);z-index:60;display:flex;
    align-items:center;justify-content:center;padding:24px`;
  const card = el('div');
  card.style.cssText = `background:var(--panel);border:1px solid var(--line2);border-radius:9px;padding:18px;
    max-width:min(760px,94vw);max-height:88vh;overflow:auto`;
  card.innerHTML = html;
  const close = el('button', 'btn primary', 'Close');
  close.style.marginTop = '12px';
  close.onclick = () => back.remove();
  card.appendChild(close);
  back.appendChild(card);
  back.onclick = e => { if (e.target === back) back.remove(); };
  document.body.appendChild(back);
  close.focus();
}

$('#fileJson').addEventListener('change', e => {
  const file = e.target.files[0]; e.target.value = '';
  if (!file) return;
  const fr = new FileReader();
  fr.onload = () => {
    try {
      const s = JSON.parse(fr.result);
      if (!Array.isArray(s.items)) throw 0;
      history.push(snapshot());
      state.room = { ...state.room, ...s.room };
      state.items = s.items;
      state.sel = null;
      uid = Math.max(1, ...state.items.map(i => (+String(i.id).replace(/\D/g, '') || 0))) + 1;
      syncRoomInputs(); stage.buildRoom(state.room);
      commit(`Loaded ${state.items.length} items.`);
    } catch { toast('That file is not a Bailando layout.'); }
  };
  fr.readAsText(file);
});

/* ---------- top bar ---------------------------------------------------- */
function syncRoomInputs() {
  $('#rw').value = fmt(state.room.w);
  $('#rd').value = fmt(state.room.d);
  $('#rp').value = fmt(state.room.parapetH);
  $('#rf').value = state.room.floor;
}

function roomChanged() {
  history.push(snapshot());
  state.room.w = Math.max(3, Math.min(60, parseFloat($('#rw').value) || 14));
  state.room.d = Math.max(3, Math.min(60, parseFloat($('#rd').value) || 9));
  state.room.parapetH = Math.max(0, Math.min(2, parseFloat($('#rp').value) || 0));
  state.room.floor = $('#rf').value;
  syncRoomInputs();
  stage.buildRoom(state.room);
  commit('');
}
['#rw', '#rd', '#rp', '#rf'].forEach(s => $(s).addEventListener('change', roomChanged));

$('#search').addEventListener('input', e => buildRail(e.target.value));
$('#undo').onclick = undo;
$('#snap').onclick = snapshotPng;
$('#exp').onclick = exportJson;
$('#imp').onclick = () => $('#fileJson').click();
$('#showClear').onchange = e => { state.showClear = e.target.checked; $('#clearTog').dataset.on = e.target.checked; buildOverlay(); };
$('#showLabels').onchange = e => { state.showLabels = e.target.checked; $('#labelTog').dataset.on = e.target.checked; };
$('#railBtn').onclick = () => $('#rail').classList.toggle('open');
$('#inspBtn').onclick = () => $('#inspect').classList.toggle('open');

for (const b of $('#viewSeg').children) {
  b.onclick = () => {
    state.view = b.dataset.v;
    for (const o of $('#viewSeg').children) o.setAttribute('aria-pressed', o === b);
    canvas.classList.toggle('walking', state.view === 'walk');
    if (state.view !== 'walk' && document.pointerLockElement) document.exitPointerLock();
    refresh();
  };
}

const moodSeg = $('#moodSeg');
for (const [k, label] of MOOD_KEYS) {
  const b = el('button', null, label);
  b.onclick = () => {
    state.mood = k; stage.setMood(k);
    for (const o of moodSeg.children) o.setAttribute('aria-pressed', o === b);
  };
  moodSeg.appendChild(b);
}

const rf = $('#rf');
for (const [k, label] of FLOOR_KEYS) {
  const o = document.createElement('option');
  o.value = k; o.textContent = label; rf.appendChild(o);
}

const presetSel = $('#presets');
presetSel.innerHTML = '<option value="">Starting layouts…</option>' +
  PRESETS.map((p, i) => `<option value="${i}">${esc(p.name)}</option>`).join('') +
  '<option value="clear">Clear the terrace</option><option value="glb">Load a .glb model…</option>';
presetSel.onchange = () => {
  const v = presetSel.value; presetSel.value = '';
  if (v === '') return;
  if (v === 'glb') { const i = document.createElement('input'); i.type = 'file'; i.accept = '.glb,model/gltf-binary';
    i.onchange = () => i.files[0] && addModelFile(i.files[0]); i.click(); return; }
  history.push(snapshot());
  if (v === 'clear') { state.items = []; state.sel = null; return commit('Terrace cleared.'); }
  const p = PRESETS[+v];
  state.room = { ...state.room, ...p.room };
  state.items = p.items.map((it, n) => ({ id: 'p' + (uid++), rot: 0, ...it, w: it.w ?? BY_KEY[it.key].w, d: it.d ?? BY_KEY[it.key].d }));
  state.sel = null;
  syncRoomInputs(); stage.buildRoom(state.room);
  commit(`${p.name} — terrace set to ${fmt(p.room.w)} × ${fmt(p.room.d)} m.`);
};

/* ---------- boot -------------------------------------------------------- */
CATALOG.push({ key: 'custom', group: 'Your images', name: 'Custom 3D model', custom: true,
  w: 1, d: 1, h: 1, clear: 0, clearDir: 'ring', seats: 0, kg: 0, spec: 'Imported .glb',
  note: 'Imported model. Check the width and depth against the real product before you rely on it.',
  build: () => new THREE.Group() });
BY_KEY.custom = CATALOG[CATALOG.length - 1];

function fitCanvas() {
  rect = $('#stage').getBoundingClientRect();
  stage.resize(rect.width, rect.height);
}
addEventListener('resize', fitCanvas);

if (!load()) {
  const p = PRESETS[0];
  state.room = { ...state.room, ...p.room };
  state.items = p.items.map(it => ({ id: 'p' + (uid++), rot: 0, ...it, w: it.w ?? BY_KEY[it.key].w, d: it.d ?? BY_KEY[it.key].d }));
}
syncRoomInputs();
stage.buildRoom(state.room);
stage.setMood(state.mood);
buildRail();
fitCanvas();
$('#viewSeg').children[1].setAttribute('aria-pressed', 'true');
moodSeg.children[2].setAttribute('aria-pressed', 'true');
$('#clearTog').dataset.on = true; $('#labelTog').dataset.on = true;
refresh();

let last = performance.now(), acc = 0;
(function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (state.view === 'walk') stepWalk(dt);
  stage.render(state.view);
  acc += dt;
  if (acc > 1 / 30) { acc = 0; drawOverlay(); }
})(last);
