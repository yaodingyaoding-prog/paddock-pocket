import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {pathToFileURL} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import fs from 'node:fs';

await build({entryPoints:['app/circuit-scene.tsx'],outfile:'.wrangler/checks/circuit-preview.mjs',bundle:true,packages:'external',platform:'node',format:'esm',jsx:'automatic',logLevel:'silent'});
const {CircuitPreview}=await import(pathToFileURL(process.cwd()+'/.wrangler/checks/circuit-preview.mjs').href);
const circuit=JSON.parse(fs.readFileSync('lib/circuit-images.json','utf8')).circuits[0];
const html=renderToStaticMarkup(createElement(CircuitPreview,{circuit,interactive:true}));
assert.ok(!html.includes('<img'),'The 3D viewer must never preload a flat circuit image');
assert.ok(html.includes('正在加载 3D'),'The circuit must start 3D automatically, without an enable button');
assert.ok(!html.includes('启用 3D'),'Visitors must not need an extra click to start the circuit');
const unknown=renderToStaticMarkup(createElement(CircuitPreview,{circuit:{id:'unknown',name:'Unknown circuit'}}));
assert.ok(unknown.includes('待补充'),'An unknown circuit must not crash the page');
assert.ok(html.includes('地形高差'),'The viewer must label the elevation range');
console.log('First visit: automatic elevation model, no flat-image preload and unknown circuit fallback passed.');
