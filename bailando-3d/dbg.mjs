import { chromium } from 'playwright';
import { readFileSync } from 'fs';
const html = readFileSync('dist/bailando-planner.html', 'utf8');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1600, height: 950 } });
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.setContent(`<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`, { waitUntil: 'load' });
await p.waitForTimeout(2500);
console.log(await p.evaluate(() => {
  const svg = document.getElementById('ovl');
  const cs = getComputedStyle(svg);
  return { innerHTML: svg.innerHTML.length, childNodes: svg.childNodes.length,
           w: svg.clientWidth, h: svg.clientHeight, display: cs.display,
           outer: svg.outerHTML.slice(0, 300) };
}));
await b.close();
