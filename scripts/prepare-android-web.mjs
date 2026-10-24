import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const base=process.argv[2]||'http://127.0.0.1:5177';
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))throw Error('Use the local production preview to capture public bootstrap HTML');
const version=JSON.parse(fs.readFileSync('package.json','utf8')).version;
const output=path.resolve('.local-artifacts/android-web/'+version);
fs.mkdirSync(output,{recursive:true});
const response=await fetch(base+'/',{signal:AbortSignal.timeout(20000)});
const html=await response.text();
if(!response.ok||!html.includes('RACE WEEKEND')||!html.includes('赛事时间安排')||html.includes('fixture-refresh-token'))throw Error('Bootstrap page is not a complete public race page');
fs.writeFileSync(path.join(output,'index.html'),html);
const roots=['_next/static','fonts','circuits/models','drivers','favicon.svg'];
function copy(relative){const source=path.join('dist/client',relative);if(!fs.existsSync(source))throw Error('Missing public build asset: '+relative);if(fs.statSync(source).isDirectory()){for(const name of fs.readdirSync(source))copy(relative+'/'+name);}else{const target=path.join(output,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);}}
for(const root of roots)copy(root);
const files=[];function scan(dir){for(const name of fs.readdirSync(dir)){const file=path.join(dir,name);if(fs.statSync(file).isDirectory())scan(file);else if(name!=='shell-manifest.json'){const bytes=fs.readFileSync(file);files.push({path:path.relative(output,file).replaceAll('\\','/'),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}}}scan(output);
const manifest={version,origin:'https://f1.xiaodinglab.com',preparedAt:new Date().toISOString(),files};
fs.writeFileSync(path.join(output,'shell-manifest.json'),JSON.stringify(manifest,null,2));
console.log(JSON.stringify({version,output,files:files.length,bytes:files.reduce((sum,f)=>sum+f.bytes,0)}));
