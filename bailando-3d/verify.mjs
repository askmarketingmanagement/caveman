import { PRESETS } from './src/presets.js';
import { BY_KEY } from './src/catalog.js';
import { analyse } from './src/checks.js';
let bad = 0;
for (const p of PRESETS) {
  const items = p.items.map((it, n) => ({ id: 'p' + n, rot: 0, ...it,
    w: it.w ?? BY_KEY[it.key].w, d: it.d ?? BY_KEY[it.key].d }));
  const r = analyse(items, { ...p.room });
  console.log(`\n=== ${p.name} — ${r.issues.length} issues (${r.clashes} clash / ${r.tights} tight)`);
  console.log(`    seats ${r.seats}  standing ${r.standing}  free ${(r.free*100).toFixed(0)}%  load ${r.load.toFixed(0)} kg/m2`);
  for (const i of r.issues) console.log(`    [${i.level}] ${i.msg}`);
  bad += r.issues.length;
}
console.log(`\ntotal issues: ${bad}`);
