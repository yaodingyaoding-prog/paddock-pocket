import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {pathToFileURL} from 'node:url';
async function load(file){const output='.wrangler/checks/'+file.replaceAll('/','-').replace('.ts','.mjs');await build({entryPoints:[file],outfile:output,bundle:true,platform:'node',format:'esm',logLevel:'silent'});return import(pathToFileURL(process.cwd()+'/'+output).href);}
const {OpenRaceEventsRepository}=await load('lib/race-events-repository.ts');
const {handleRaceEventsRequest}=await load('lib/race-events-controller.ts');
const {protectedAccountPath}=await load('lib/auth/protection.ts');
const session={session_key:42,meeting_key:5,year:2026,session_name:'Race',date_start:'2026-11-08T17:00:00Z',date_end:'2026-11-08T19:00:00Z'};
let calls=0,mode='valid';const origins=[];
const request=async(url,options)=>{
 const u=new URL(url);origins.push(u.origin);calls++;assert.equal(options.redirect,'manual','The Worker must reject redirects without using the unsupported redirect:error mode');
 if(mode==='redirect')return new Response(null,{status:302,headers:{Location:'https://untrusted.test/'}});
 if(mode==='oversize')return new Response('{}',{headers:{'Content-Length':String(3*1024*1024)}});
 if(u.pathname.endsWith('/sessions'))return Response.json([session]);
 if(u.pathname.endsWith('/drivers'))return Response.json([{driver_number:23,name_acronym:'ALB',full_name:'Alex Albon'}]);
 return Response.json([{session_key:42,date:mode==='invalid'?'not-a-date':'2026-11-08T17:40:00Z',message:'RED FLAG',flag:'RED'}]);
};
const repo=new OpenRaceEventsRepository(request);assert.equal((await repo.sessions(2026))[0].session_key,42);await repo.sessions(2026);assert.equal(calls,1);
const data=await repo.weekend(5,42);assert.equal(data.messages[0].flag,'RED');assert.equal(data.drivers[0].name_acronym,'ALB');
for(const invalid of ['redirect','oversize','invalid']){mode=invalid;await assert.rejects(()=>new OpenRaceEventsRepository(request).weekend(5,42));}
assert.ok(origins.every(origin=>origin==='https://api.openf1.org'));
const season='3589dd46-e3ab-9929-435d-93b14f52cf6e',gp='d5d02d19-c8b1-4d45-a6c8-ac18094effcf';
let loads=0;const service={load:async query=>{loads++;return {raceId:query.gp,year:query.year,state:'available',items:[],stale:false};}};
const url='https://app.test/api/race-events?'+new URLSearchParams({season,gp,year:'2026'});
const valid=await handleRaceEventsRequest(new Request(url),service);assert.equal(valid.status,200);assert.match(valid.headers.get('Cache-Control'),/public/);assert.equal((await valid.json()).data.raceId,gp);
for(const query of ['year=2026&season=invalid&gp='+gp,'year=2026&season='+season+'&gp=https://evil.test/','year=abc&season='+season+'&gp='+gp])assert.equal((await handleRaceEventsRequest(new Request('https://app.test/api/race-events?'+query),service)).status,400);
assert.equal(loads,1,'Invalid public queries must be rejected before loading');
const unavailable=await handleRaceEventsRequest(new Request(url),{load:async()=>{throw Error('fixture outage');}});assert.equal(unavailable.status,503);assert.equal(unavailable.headers.get('Cache-Control'),'no-store');
assert.equal(protectedAccountPath('/api/race-events','GET'),false);assert.equal(protectedAccountPath('/api/race-events','POST'),true);
console.log('Race-event API: Worker redirect compatibility, bounds/schema checks, source allowlist, caching, query validation, public reads and outage responses passed.');
