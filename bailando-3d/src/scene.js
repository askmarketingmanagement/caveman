import { THREE, MATS, box, canvasTexture, hbar } from './lib.js';

/* ---------- procedural floor finishes -------------------------------- */
const FLOORS = {
  terrazzo: { label: 'Terrazzo', make: () => canvasTexture(512, 512, (c, w, h) => {
      c.fillStyle = '#cfc9bd'; c.fillRect(0, 0, w, h);
      const cols = ['#8d857a', '#b9483f', '#3f4f68', '#e6e2d8', '#6f7a5c', '#c9963f'];
      for (let i = 0; i < 2600; i++) {
        c.fillStyle = cols[i % cols.length]; c.globalAlpha = 0.55 + (i % 5) / 12;
        const x = Math.random() * w, y = Math.random() * h, s = 2 + Math.random() * 9;
        c.save(); c.translate(x, y); c.rotate(Math.random() * 3.2);
        c.fillRect(-s / 2, -s / 3, s, s * (0.35 + Math.random() * 0.4)); c.restore();
      }
      c.globalAlpha = 1;
    }, 6, 6), rough: 0.35 },

  deck: { label: 'Timber deck', make: () => canvasTexture(512, 512, (c, w, h) => {
      c.fillStyle = '#7a512f'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 8; i++) {
        const y = i * h / 8;
        c.fillStyle = ['#835733', '#734a2b', '#8c5e38', '#6d452a'][i % 4];
        c.fillRect(0, y + 1, w, h / 8 - 3);
        c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = 1;
        for (let k = 0; k < 26; k++) {
          c.beginPath(); c.moveTo(Math.random() * w, y + 3);
          c.bezierCurveTo(Math.random() * w, y + h / 24, Math.random() * w, y + h / 12, Math.random() * w, y + h / 8 - 4);
          c.globalAlpha = 0.10 + Math.random() * 0.14; c.stroke();
        }
        c.globalAlpha = 1;
      }
    }, 5, 5), rough: 0.72 },

  tile: { label: 'Large tile', make: () => canvasTexture(512, 512, (c, w, h) => {
      c.fillStyle = '#3b3f47'; c.fillRect(0, 0, w, h);
      for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) {
        c.fillStyle = ['#4a4f59', '#454a54', '#50555f', '#42474f'][(x + y * 2) % 4];
        c.fillRect(x * w / 2 + 3, y * h / 2 + 3, w / 2 - 6, h / 2 - 6);
        c.globalAlpha = 0.10;
        for (let i = 0; i < 60; i++) {
          c.strokeStyle = '#cfd4dd'; c.beginPath();
          const sx = x * w / 2 + Math.random() * w / 2, sy = y * h / 2 + Math.random() * h / 2;
          c.moveTo(sx, sy); c.lineTo(sx + (Math.random() - .5) * 60, sy + (Math.random() - .5) * 60); c.stroke();
        }
        c.globalAlpha = 1;
      }
    }, 8, 8), rough: 0.22 },

  concrete: { label: 'Polished concrete', make: () => canvasTexture(512, 512, (c, w, h) => {
      c.fillStyle = '#7f7d78'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 5000; i++) {
        c.fillStyle = `rgba(${120 + Math.random() * 60 | 0},${118 + Math.random() * 60 | 0},${112 + Math.random() * 60 | 0},.5)`;
        c.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 4, 2 + Math.random() * 4);
      }
    }, 4, 4), rough: 0.3 },
};
export const FLOOR_KEYS = Object.entries(FLOORS).map(([k, v]) => [k, v.label]);

/* ---------- sky + skyline panorama ----------------------------------- */
function skyTexture(mood) {
  return canvasTexture(2048, 1024, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    if (mood === 'day')    { g.addColorStop(0, '#3f7bc4'); g.addColorStop(.45, '#8ab6de'); g.addColorStop(.72, '#cfdce8'); g.addColorStop(1, '#e6e2d6'); }
    if (mood === 'sunset') { g.addColorStop(0, '#23305c'); g.addColorStop(.40, '#8c5a86'); g.addColorStop(.66, '#e08a55'); g.addColorStop(.84, '#f2c07a'); g.addColorStop(1, '#5c4a48'); }
    if (mood === 'night')  { g.addColorStop(0, '#05070f'); g.addColorStop(.55, '#0b1226'); g.addColorStop(.82, '#1b2340'); g.addColorStop(1, '#2a2338'); }
    c.fillStyle = g; c.fillRect(0, 0, w, h);

    if (mood === 'night') {
      for (let i = 0; i < 500; i++) {
        c.fillStyle = `rgba(255,255,255,${Math.random() * .7})`;
        c.fillRect(Math.random() * w, Math.random() * h * .5, 1.4, 1.4);
      }
    }
    if (mood === 'sunset') {
      const s = c.createRadialGradient(w * .72, h * .78, 4, w * .72, h * .78, 220);
      s.addColorStop(0, 'rgba(255,226,168,.95)'); s.addColorStop(1, 'rgba(255,180,110,0)');
      c.fillStyle = s; c.fillRect(w * .72 - 240, h * .78 - 240, 480, 480);
    }

    /* city skyline sitting on the horizon — this is an 8th-floor terrace */
    const horizon = h * 0.80;
    let x = 0, seed = 7;
    const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    while (x < w) {
      const bw = 26 + rnd() * 96, bh = 30 + rnd() * 250;
      const far = rnd() > .55;
      const y = horizon - bh + (far ? 14 : 0);
      c.fillStyle = mood === 'night' ? (far ? '#0d1424' : '#070a13')
                  : mood === 'sunset' ? (far ? '#4a3a52' : '#2b2233')
                  : (far ? '#a9b6c4' : '#8a99ab');
      c.fillRect(x, y, bw, bh + 40);
      if (mood === 'night') {
        for (let wy = y + 8; wy < horizon; wy += 11)
          for (let wx = x + 5; wx < x + bw - 6; wx += 9)
            if (rnd() > .55) { c.fillStyle = rnd() > .82 ? 'rgba(180,215,255,.85)' : 'rgba(255,206,130,.8)'; c.fillRect(wx, wy, 4, 5); }
      } else if (mood === 'sunset') {
        for (let wy = y + 8; wy < horizon; wy += 13)
          for (let wx = x + 5; wx < x + bw - 6; wx += 10)
            if (rnd() > .78) { c.fillStyle = 'rgba(255,200,130,.55)'; c.fillRect(wx, wy, 4, 5); }
      }
      x += bw + 4 + rnd() * 16;
    }
  }, 1, 1);
}

const MOODS = {
  day:    { label: 'Daylight',  hemiSky: 0xbcd6f0, hemiGnd: 0x8a7a63, hemi: 1.05, sun: 2.4, sunCol: 0xfff4e2, sunPos: [ 9, 13,  7], exposure: 1.05, venue: 0.0,  fog: 0x9fb6cd, fogD: 0.006 },
  sunset: { label: 'Sunset',    hemiSky: 0xe0a07a, hemiGnd: 0x4b3b46, hemi: 0.75, sun: 2.0, sunCol: 0xffa860, sunPos: [-13, 3.4, 5], exposure: 1.02, venue: 0.55, fog: 0xc08a6a, fogD: 0.010 },
  night:  { label: 'Night',     hemiSky: 0x2a3352, hemiGnd: 0x14161f, hemi: 0.30, sun: 0.22, sunCol: 0x9fb4e8, sunPos: [-8, 11, -6], exposure: 1.18, venue: 1.0,  fog: 0x0b1020, fogD: 0.014 },
};
export const MOOD_KEYS = Object.entries(MOODS).map(([k, v]) => [k, v.label]);

/* ===================================================================== */
export class Stage {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;

    this.scene = new THREE.Scene();
    this.world = new THREE.Group();  this.scene.add(this.world);   // room shell
    this.items = new THREE.Group();  this.scene.add(this.items);   // placed furniture
    this.overlay = new THREE.Group();this.scene.add(this.overlay);  // clearances, selection

    this.sky = new THREE.Mesh(new THREE.SphereGeometry(140, 40, 24), new THREE.MeshBasicMaterial({ side: THREE.BackSide }));
    this.scene.add(this.sky);

    this.hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
    this.sun = new THREE.DirectionalLight(0xffffff, 2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const s = this.sun.shadow.camera;
    s.near = 1; s.far = 90; s.left = -22; s.right = 22; s.top = 22; s.bottom = -22;
    this.sun.shadow.bias = -0.0008;
    this.scene.add(this.hemi, this.sun, this.sun.target);

    this.venueLights = new THREE.Group(); this.scene.add(this.venueLights);

    this.cam3d = new THREE.PerspectiveCamera(52, 1, 0.1, 400);
    this.camPlan = new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 200);
    this.camWalk = new THREE.PerspectiveCamera(72, 1, 0.05, 300);
    this.camera = this.cam3d;

    this.mood = 'night';
    this._draft = false;
    this.floorKey = 'terrazzo';
    this._floorTex = {};
  }

  setMood(key) {
    this.mood = key;
    const m = MOODS[key];
    this.hemi.color.setHex(m.hemiSky); this.hemi.groundColor.setHex(m.hemiGnd); this.hemi.intensity = m.hemi;
    this.sun.color.setHex(m.sunCol); this.sun.intensity = m.sun;
    this.sun.position.set(...m.sunPos);
    this.renderer.toneMappingExposure = m.exposure;
    this.scene.fog = new THREE.FogExp2(m.fog, m.fogD);
    this.sky.material.map = skyTexture(key); this.sky.material.needsUpdate = true;
    this.venueLights.visible = m.venue > 0;
    this.venueLights.children.forEach(l => { if (l.isLight) l.intensity = l.userData.base * m.venue; });
    this.scene.traverse(o => {
      if (o.material && o.material.emissiveIntensity !== undefined && o.userData.baseEmissive !== undefined)
        o.material.emissiveIntensity = o.userData.baseEmissive * (0.25 + m.venue * 0.95);
    });
  }

  floorTex(key) {
    if (!this._floorTex[key]) this._floorTex[key] = FLOORS[key].make();
    return this._floorTex[key];
  }

  /* Rebuild the terrace shell for a room definition. */
  buildRoom(room) {
    this.world.clear();
    this.venueLights.clear();
    const { w, d, parapetH, openAir, wallH } = room;

    const tex = this.floorTex(room.floor || 'terrazzo').clone();
    tex.needsUpdate = true;
    tex.repeat.set(Math.max(2, w / 2), Math.max(2, d / 2));
    const floorMat = new THREE.MeshStandardMaterial({ map: tex, roughness: FLOORS[room.floor || 'terrazzo'].rough, metalness: 0.02 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat);
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.name = 'floor';
    this.world.add(floor);
    this.floor = floor;

    // slab edge so it reads as a building, not a plane
    this.world.add(box(w + 0.6, 0.45, d + 0.6, MATS.concrete, 0, -0.46, 0));

    const ph = parapetH ?? 1.1;
    const t = 0.22;
    const wallMat = MATS.plaster;
    if (ph > 0) {
      this.world.add(box(w + t * 2, ph, t, wallMat, 0, 0, -d / 2 - t / 2));
      this.world.add(box(w + t * 2, ph, t, wallMat, 0, 0,  d / 2 + t / 2));
      this.world.add(box(t, ph, d, wallMat, -w / 2 - t / 2, 0, 0));
      this.world.add(box(t, ph, d, wallMat,  w / 2 + t / 2, 0, 0));
      // coping + a warm cove strip along the parapet
      for (const [bw, bd, x, z] of [[w + t * 2, t, 0, -d / 2 - t / 2], [w + t * 2, t, 0, d / 2 + t / 2],
                                    [t, d, -w / 2 - t / 2, 0], [t, d, w / 2 + t / 2, 0]]) {
        this.world.add(box(bw + 0.06, 0.05, bd + 0.06, MATS.concrete, x, ph, z));
      }
      const cove = new THREE.Mesh(new THREE.BoxGeometry(w - 0.2, 0.03, 0.03),
        new THREE.MeshStandardMaterial({ color: 0xffb347, emissive: 0xffb347, emissiveIntensity: 1.4 }));
      cove.userData.baseEmissive = 1.4;
      cove.position.set(0, ph - 0.10, -d / 2 + 0.02); this.world.add(cove);
    }

    if (!openAir && wallH > 0) {
      const back = new THREE.Mesh(new THREE.BoxGeometry(w + t * 2, wallH - ph, t), wallMat);
      back.position.set(0, ph + (wallH - ph) / 2, -d / 2 - t / 2);
      back.castShadow = true; back.receiveShadow = true; this.world.add(back);
    }

    // grid
    const grid = new THREE.GridHelper(Math.max(w, d), Math.max(w, d), 0x57c7e8, 0x39415a);
    grid.material.transparent = true; grid.material.opacity = 0.16;
    grid.position.y = 0.004; grid.name = 'grid';
    this.grid = grid; this.world.add(grid);

    // venue lighting for the night mood
    const add = (L, base) => { L.userData.base = base; this.venueLights.add(L); };
    const warm = 0xffb066, rosa = 0xff5c7a, cyan = 0x57c7e8;
    const cols = [warm, rosa, cyan, warm];
    for (let i = 0; i < 4; i++) {
      const px = (i % 2 ? 1 : -1) * w * 0.26, pz = (i < 2 ? -1 : 1) * d * 0.26;
      const p = new THREE.PointLight(cols[i], 0, 13, 2);
      p.position.set(px, 2.5, pz); add(p, i === 0 || i === 3 ? 26 : 18);
    }
    const amb = new THREE.PointLight(0xffc38a, 0, 22, 2);
    amb.position.set(0, 3.2, 0); add(amb, 16);

    this.setMood(this.mood);
    this.room = room;
    this.frameRoom(room);
  }

  frameRoom(room) {
    const r = Math.max(room.w, room.d);
    this.orbit = { target: new THREE.Vector3(0, 0.9, 0), radius: r * 1.15, theta: -0.72, phi: 0.94 };
    this.planZoom = r * 0.62;
    this.walk = { pos: new THREE.Vector3(0, 1.65, room.d / 2 - 1.2), yaw: Math.PI, pitch: -0.06 };
  }

  resize(w, h) {
    this.renderer.setSize(w, h, false);
    this.cam3d.aspect = w / h; this.cam3d.updateProjectionMatrix();
    this.camWalk.aspect = w / h; this.camWalk.updateProjectionMatrix();
    this._aspect = w / h;
    this.updatePlanCam();
  }

  updatePlanCam() {
    const a = this._aspect || 1, z = this.planZoom || 8;
    const c = this.camPlan;
    c.left = -z * a; c.right = z * a; c.top = z; c.bottom = -z;
    c.updateProjectionMatrix();
  }

  applyCamera(mode) {
    if (mode === 'plan') {
      this.camera = this.camPlan;
      const t = this.orbit.target;
      this.camPlan.position.set(t.x, 60, t.z);
      this.camPlan.up.set(0, 0, -1);
      this.camPlan.lookAt(t.x, 0, t.z);
      this.updatePlanCam();
      this.grid && (this.grid.material.opacity = 0.30);
    } else if (mode === 'walk') {
      this.camera = this.camWalk;
      const wk = this.walk;
      this.camWalk.position.copy(wk.pos);
      this.camWalk.rotation.set(0, 0, 0, 'YXZ');
      this.camWalk.rotation.y = wk.yaw; this.camWalk.rotation.x = wk.pitch;
      this.grid && (this.grid.material.opacity = 0.06);
    } else {
      this.camera = this.cam3d;
      const o = this.orbit;
      const sp = new THREE.Spherical(o.radius, o.phi, o.theta);
      this.cam3d.position.setFromSpherical(sp).add(o.target);
      this.cam3d.lookAt(o.target);
      this.grid && (this.grid.material.opacity = 0.16);
    }
    // sun target follows the room
    this.sun.target.position.set(0, 0, 0); this.sun.target.updateMatrixWorld();
  }

  /* Plan view is a drawing, not a mood shot — light it flat and neutral so
     dimensions stay readable whatever the venue lighting is set to. */
  setDraft(on) {
    if (on === this._draft) return;
    this._draft = on;
    if (on) {
      this._saved = { hemi: this.hemi.intensity, sun: this.sun.intensity, exp: this.renderer.toneMappingExposure, fog: this.scene.fog };
      this.hemi.color.setHex(0xffffff); this.hemi.groundColor.setHex(0xb9b6ae);
      this.hemi.intensity = 2.6; this.sun.intensity = 0.7;
      this.renderer.toneMappingExposure = 1.0;
      this.scene.fog = null;
      this.venueLights.visible = false;
    } else {
      if (this._saved) this.scene.fog = this._saved.fog;
      this.setMood(this.mood);
    }
  }

  render(mode) {
    this.setDraft(mode === 'plan');
    this.applyCamera(mode);
    this.sky.position.copy(this.camera.position);
    this.renderer.render(this.scene, this.camera);
  }
}
