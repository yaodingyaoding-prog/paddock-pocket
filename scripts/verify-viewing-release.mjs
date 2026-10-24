import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { Script } from 'node:vm';
import { zipEntry } from './read-zip-entry.mjs';
const release = JSON.parse(fs.readFileSync('public/user-scripts/release.json','utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const read = name => fs.readFileSync('public/user-scripts/' + name);
for (const file of release.files) {
  assert(!file.path.includes('..') && !file.path.includes('/'));
  const bytes = read(file.path); assert.equal(bytes.length,file.bytes); assert.equal(hash(bytes),file.sha256,file.path);
  if (file.path.endsWith('.user.js')) {
    assert.equal(bytes.toString('utf8').match(/@version\s+([^\s]+)/)?.[1],release.version);
    new Script(bytes.toString('utf8'),{filename:file.path}); // Syntax only; never execute third-party code here.
  }
}
const all = read('SMG-All-Platforms-' + release.version + '.zip');
for (const [member,file] of [['desktop/smg_fivestar.user.js','smg_fivestar.user.js'],['android/smg_fivestar.android.user.js','smg_fivestar.android.user.js'],['ios/smg_fivestar.ipad.user.js','smg_fivestar.ipad.user.js'],['ios/smg_fivestar.ipad-helper.user.js','smg_fivestar.ipad-helper.user.js'],['LICENSE','LICENSE']]) assert.deepEqual(zipEntry(all,member),read(file));
const android = read('SMG-Android-' + release.version + '.zip');
assert.deepEqual(zipEntry(android,'smg_fivestar.android.user.js'),read('smg_fivestar.android.user.js'));
assert.deepEqual(zipEntry(android,'LICENSE'),read('LICENSE'));
const apkRelease=JSON.parse(fs.readFileSync('public/downloads/android-build.json','utf8'));
const apk=fs.readFileSync('public'+apkRelease.download),script=read('smg_fivestar.android.user.js');
assert.equal(apkRelease.viewingScriptVersion,release.version);
assert.equal(apkRelease.viewingScriptSha256,hash(script));
assert.deepEqual(zipEntry(apk,'assets/web/user-scripts/smg_fivestar.android.user.js'),script);
assert.deepEqual(zipEntry(apk,'assets/web/user-scripts/LICENSE'),read('LICENSE'));
assert.deepEqual(fs.readFileSync('native/android/assets/web/user-scripts/smg_fivestar.android.user.js'),script);
console.log('SMG release: all script versions/checksums/syntax, three-platform and Android ZIP contents, exact APK helper and bundled MIT license passed.');
