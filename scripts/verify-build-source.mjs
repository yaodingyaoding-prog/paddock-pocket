import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {webSourceFingerprint,verifyWebSource} from './web-source-fingerprint.mjs';
const original=process.cwd(),fixture=fs.mkdtempSync(path.resolve('.wrangler/source-check-'));
try{
 process.chdir(fixture);
 fs.mkdirSync('app');fs.mkdirSync('public/downloads',{recursive:true});
 fs.writeFileSync('package.json',JSON.stringify({version:'1.0.2'}));
 fs.writeFileSync('app/page.tsx','export default 1;');
 const fingerprint=webSourceFingerprint();
 fs.writeFileSync('manifest.json',JSON.stringify({version:'1.0.2',sourceFingerprint:fingerprint}));
 assert.equal(verifyWebSource('manifest.json').sourceFingerprint,fingerprint);
 fs.writeFileSync('public/downloads/package.apk','delivery-only');
 assert.equal(webSourceFingerprint(),fingerprint,'Published APK delivery metadata must not create a self-referential source hash');
 fs.writeFileSync('app/page.tsx','export default 2;');
 assert.throws(()=>verifyWebSource('manifest.json'),/stale/,'Changed application source rejects old bundled pages');
 fs.writeFileSync('app/page.tsx','export default 1;');
 fs.writeFileSync('package.json',JSON.stringify({version:'1.0.3'}));
 assert.throws(()=>verifyWebSource('manifest.json'),/stale/,'Changed versions reject old bundled pages');
}finally{
 process.chdir(original);
 if(path.dirname(fixture)!==path.resolve('.wrangler')||!path.basename(fixture).startsWith('source-check-'))throw Error('Unsafe test cleanup');
 fs.rmSync(fixture,{recursive:true,force:true});
}
console.log('Build source: matching shell, source/version drift rejection and nonrecursive delivery hash passed.');
