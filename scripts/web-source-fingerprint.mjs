import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';import {fileURLToPath} from 'node:url';
export function webSourceFingerprint(root=process.cwd()){
 const hash=createHash('sha256');
 function scan(relative){const file=path.join(root,relative);if(!fs.existsSync(file))return;if(fs.statSync(file).isDirectory()){for(const name of fs.readdirSync(file).sort())if(!(relative==='public'&&name==='downloads'))scan(relative+'/'+name);}else{hash.update(relative+'\0');hash.update(fs.readFileSync(file));}}
 for(const relative of ['app','lib','public','package.json','package-lock.json','vite.config.ts','scripts/build-web.mjs','scripts/web-source-fingerprint.mjs'])scan(relative);
 return hash.digest('hex');
}
export function verifyWebSource(file){const value=JSON.parse(fs.readFileSync(file,'utf8'));if(value.sourceFingerprint!==webSourceFingerprint()||value.version!==JSON.parse(fs.readFileSync('package.json','utf8')).version)throw Error('Web build is stale. Rebuild the website and prepare a fresh Android shell.');return value;}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){verifyWebSource(process.argv[2]);console.log('Android web source fingerprint verified.');}
