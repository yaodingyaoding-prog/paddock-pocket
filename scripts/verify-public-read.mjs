import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {pathToFileURL} from 'node:url';
await build({entryPoints:['lib/public-read.ts'],outfile:'.wrangler/checks/public-read.mjs',bundle:true,platform:'node',format:'esm',logLevel:'silent'});
const {readPublicJson}=await import(pathToFileURL(process.cwd()+'/.wrangler/checks/public-read.mjs').href+'?run='+Date.now());
const expected={data:{points:42},source:'live',updatedAt:'2026-10-25T00:00:00Z'};
let calls=0;
const options={pause:async()=>{},request:async()=>{if(++calls===1)throw new TypeError('connection reset');return Response.json(expected);}};
assert.deepEqual(await readPublicJson('/api/data?resource=drivers',options),expected);
assert.equal(calls,2,'A transient read failure is retried once without waiting for a manual reload');
for(const status of [400,401,403,404,429]){
 calls=0;await assert.rejects(readPublicJson('/api/data',{pause:async()=>{},request:async()=>{calls++;return Response.json({error:'rejected'},{status});}}));
 assert.equal(calls,1,'Permanent errors and rate limits must not cause repeated requests');
}
calls=0;
await readPublicJson('/api/data',{pause:async()=>{},request:async()=>++calls===1?new Response('upstream unavailable',{status:503}):Response.json(expected)});
assert.equal(calls,2,'Gateway failures get one safe GET retry');
const cancelled=new AbortController();cancelled.abort();calls=0;
await assert.rejects(readPublicJson('/api/data',{signal:cancelled.signal,request:async()=>{calls++;return Response.json(expected);}}));
assert.equal(calls,0,'Cancelled pages must not send requests');
calls=0;await assert.rejects(readPublicJson('/api/data',{pause:async()=>{},request:async()=>{calls++;return new Response('<html>broken</html>',{status:200});}}));
assert.equal(calls,1,'Malformed success responses must not become retry loops');
calls=0;
assert.deepEqual(await readPublicJson('/api/data',{pause:async()=>{},request:async()=>{
 if(++calls===1)return new Response(new ReadableStream({start(controller){controller.error(new TypeError('body connection reset'));}}));
 return Response.json(expected);
}}),expected);
assert.equal(calls,2,'A connection lost while reading the body gets one bounded retry');
console.log('Public reads: bounded network/gateway/body retries, rate-limit restraint, cancellation and malformed responses passed.');
