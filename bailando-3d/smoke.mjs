import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const html = readFileSync('dist/bailando-planner.html', 'utf8');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
const errs = [];
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));

await page.setContent(`<!doctype html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`,
  { waitUntil: 'load' });
await page.waitForTimeout(3500);

const state = await page.evaluate(() => ({
  items: document.querySelectorAll('#picks .pick').length,
  groups: document.querySelectorAll('#picks .grouphead').length,
  status: document.getElementById('status').innerText.replace(/\s+/g, ' '),
  issues: document.getElementById('issues').innerText.slice(0, 200),
  stats: [...document.querySelectorAll('#stats .stat')].map(s => s.innerText.replace(/\n/g, ' ')),
  svg: document.getElementById('ovl').innerHTML.length,
  canvas: (() => { const c = document.getElementById('view'); return c.width + 'x' + c.height; })(),
}));
console.log(JSON.stringify(state, null, 1));
console.log('ERRORS:', errs.length ? errs.slice(0, 12) : 'none');

await page.screenshot({ path: 'shot-3d.png' });
// plan view
await page.click('#viewSeg button[data-v="plan"]');
await page.waitForTimeout(900);
await page.screenshot({ path: 'shot-plan.png' });
// daylight + orbit
await page.click('#viewSeg button[data-v="orbit"]');
await page.click('#moodSeg button:first-child');
await page.waitForTimeout(900);
await page.screenshot({ path: 'shot-day.png' });
await browser.close();
