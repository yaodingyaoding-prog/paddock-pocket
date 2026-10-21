import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

for (const file of fs.readdirSync('app').filter(name => name.endsWith('.css'))) {
  const css = fs.readFileSync(path.join('app', file), 'utf8');
  assert.doesNotMatch(css, /@import\s+(?:url\(\s*)?['"]?https?:\/\//i,
    `${file}: first paint must not wait for a third-party stylesheet`);
}
const css = fs.readFileSync('app/local-fonts.css', 'utf8');
const fonts = JSON.parse(fs.readFileSync('public/fonts/sources.json', 'utf8'));
assert.equal(fonts.files.length, 9, 'Preserve all three weights and original language subsets');
for (const file of fonts.files) {
  const bytes = fs.readFileSync('public/fonts/' + file.filename);
  assert.equal(bytes.subarray(0, 4).toString(), 'wOF2');
  assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256);
  assert.ok(css.includes('/fonts/' + file.filename));
}
assert.ok(fs.readFileSync('public/fonts/OFL-Barlow-Condensed.txt', 'utf8').includes('SIL OPEN FONT LICENSE Version 1.1'));
assert.doesNotMatch(css, /url\(https?:/i);
console.log('Font checks passed: no remote stylesheet imports, same-origin WOFF2 files, all weights/subsets, license and integrity.');
