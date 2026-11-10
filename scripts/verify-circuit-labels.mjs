import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {pathToFileURL} from 'node:url';
await build({entryPoints:['lib/circuit-label-layout.ts'],outfile:'.wrangler/checks/circuit-label-layout.mjs',bundle:true,platform:'node',format:'esm',logLevel:'silent'});
const {layoutCircuitLabels}=await import(pathToFileURL(process.cwd()+'/.wrangler/checks/circuit-label-layout.mjs').href);
for(const [width,height] of [[140,140],[260,210],[340,260],[320,400],[900,500]]){
 for(const [x,y] of [[0,0],[width,height],[width/2,height/2]]){
  const anchors=Array.from({length:3},()=>({x,y,width:90,height:24}));
  const result=layoutCircuitLabels(anchors,width,height);
  for(const point of result){
   assert.ok(point.x>=6&&point.x+90<=width-6,'Labels must stay inside the horizontal canvas edges');
   assert.ok(point.y>=6&&point.y+24<=height-Math.min(44,height*.2)-6,'Labels must clear the bottom controls');
  }
  const sorted=[...result].sort((a,b)=>a.y-b.y);
  for(let i=1;i<sorted.length;i++)assert.ok(sorted[i].y>=sorted[i-1].y+28,'Coincident highest/lowest/start anchors must have separate readable labels');
 }
}
assert.deepEqual(layoutCircuitLabels([],320,210),[]);
console.log('Circuit labels: coincident anchors, viewport edges, bottom controls and phone/desktop sizes passed.');
