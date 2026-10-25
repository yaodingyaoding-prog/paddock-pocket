import assert from 'node:assert/strict';import {build} from 'esbuild';import {pathToFileURL} from 'node:url';
await build({entryPoints:['lib/circuit-camera.ts'],outfile:'.wrangler/checks/circuit-camera.mjs',bundle:true,platform:'node',format:'esm',logLevel:'silent'});
const {circuitCameraDistance}=await import(pathToFileURL(process.cwd()+'/.wrangler/checks/circuit-camera.mjs').href);
for(const radius of [20,60,100])for(const aspect of [.4,.65,1,1.8,2.5]){
 const distance=circuitCameraDistance(radius,aspect),vertical=35*Math.PI/360,horizontal=Math.atan(Math.tan(vertical)*aspect);
 assert(distance*Math.sin(vertical)>radius);assert(distance*Math.sin(horizontal)>radius);
}
assert(circuitCameraDistance(60,.5)>circuitCameraDistance(60,1.5));
console.log('Circuit camera: complete model fits portrait, square and landscape viewports with margin.');
