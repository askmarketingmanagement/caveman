import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

mkdirSync('dist', { recursive: true });
await build({
  entryPoints: ['src/app.js'],
  bundle: true, format: 'iife', minify: true, target: ['es2020'],
  outfile: 'dist/app.js', legalComments: 'none', logLevel: 'info',
});
const js = readFileSync('dist/app.js', 'utf8');
const html = readFileSync('index.template.html', 'utf8');
const out = html.replace('</div>\n<input type="file" id="fileImg"',
  '</div>\n<input type="file" id="fileImg"')
  + `\n<script>\n${js}\n</script>\n`;
writeFileSync('dist/bailando-planner.html', out);
console.log('page:', (out.length / 1024 / 1024).toFixed(2), 'MB');
