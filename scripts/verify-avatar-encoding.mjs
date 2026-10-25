import fs from 'node:fs';import assert from 'node:assert/strict';import {build} from 'esbuild';import {pathToFileURL} from 'node:url';
import {simd} from 'wasm-feature-detect';import encode,{init} from '@jsquash/webp/encode.js';
const wasmFile=await simd()?'webp_enc_simd.wasm':'webp_enc.wasm';
await init(await WebAssembly.compile(fs.readFileSync('node_modules/@jsquash/webp/codec/enc/'+wasmFile)));
await build({entryPoints:['lib/avatar-encoder.ts'],outfile:'.wrangler/checks/avatar-encoder.mjs',bundle:true,packages:'external',platform:'node',format:'esm',logLevel:'silent'});
await build({entryPoints:['lib/auth/avatarValidation.ts'],outfile:'.wrangler/checks/avatar-validator.mjs',bundle:true,packages:'external',platform:'node',format:'esm',logLevel:'silent'});
const {encodeAvatar}=await import(pathToFileURL(process.cwd()+'/.wrangler/checks/avatar-encoder.mjs').href),{validateAvatar}=await import(pathToFileURL(process.cwd()+'/.wrangler/checks/avatar-validator.mjs').href);
const data=new Uint8ClampedArray(256*256*4);for(let n=0;n<data.length;n+=4){data[n]=(n/4)%256;data[n+1]=Math.floor(n/1024);data[n+2]=120;data[n+3]=255;}
const pixels={data,width:256,height:256,colorSpace:'srgb'},webp=await encode(pixels,{quality:82});let reads=0,fallbacks=0;
const canvas={width:256,height:256,getContext:()=>({getImageData:(x,y,w,h)=>{assert.deepEqual([x,y,w,h],[0,0,256,256]);reads++;return pixels;}}),toBlob:callback=>callback(new Blob([webp],{type:'image/webp'}))};
const native=await encodeAvatar(canvas,async()=>{fallbacks++;return webp;});assert.equal(native.type,'image/webp');assert.equal(fallbacks,0);assert.equal(reads,0);validateAvatar(new Uint8Array(await native.arrayBuffer()),native.type);
// Reproduce the reported WebKit behaviour: requesting WebP silently returns PNG.
canvas.toBlob=callback=>callback(new Blob(['png-fixture'],{type:'image/png'}));
const compatible=await encodeAvatar(canvas);assert.equal(compatible.type,'image/webp');assert.equal(reads,1);validateAvatar(new Uint8Array(await compatible.arrayBuffer()),compatible.type);
for(const toBlob of [callback=>callback(null),()=>{throw Error('not supported');},undefined]){canvas.toBlob=toBlob;const result=await encodeAvatar(canvas);validateAvatar(new Uint8Array(await result.arrayBuffer()),result.type);}
await assert.rejects(encodeAvatar({...canvas,width:512}),/裁剪/);
await assert.rejects(encodeAvatar(canvas,async()=>{throw Error('offline');}),/Safari 或 Chrome/);
console.log('Avatar encoding: real WebP codec, native fast path, WebKit PNG return, null/missing/throwing canvas encoders, bounded cropped pixels and server acceptance passed.');
