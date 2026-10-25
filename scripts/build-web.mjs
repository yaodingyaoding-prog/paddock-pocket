import fs from 'node:fs';import {spawn} from 'node:child_process';import {webSourceFingerprint} from './web-source-fingerprint.mjs';
const sourceFingerprint=webSourceFingerprint();
const child=spawn(process.execPath,['node_modules/vite/bin/vite.js','build'],{stdio:'inherit'});
const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',resolve);});
if(code!==0)process.exit(typeof code==='number'?code:1);
if(sourceFingerprint!==webSourceFingerprint())throw Error('Sources changed during the build. Run the build again.');
fs.writeFileSync('dist/client/build-source.json',JSON.stringify({version:JSON.parse(fs.readFileSync('package.json','utf8')).version,sourceFingerprint,builtAt:new Date().toISOString()},null,2)+'\n');
