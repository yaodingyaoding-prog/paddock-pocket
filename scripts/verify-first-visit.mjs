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
assert.ok(html.includes('src="'+circuit.file+'"'),'A first visitor must see the circuit layout without executing JavaScript or creating WebGL');
assert.ok(html.includes('启用 3D'),'Heavy rendering must wait for an explicit request');
const unknown=renderToStaticMarkup(createElement(CircuitPreview,{circuit:{id:'unknown',name:'Unknown circuit'}}));
assert.ok(unknown.includes('待补充'),'An unknown circuit must not crash the page');
console.log('First visit: server-rendered circuit preview, opt-in 3D and unknown circuit fallback passed.');
