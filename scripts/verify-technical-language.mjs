import assert from 'node:assert/strict';import {build} from 'esbuild';import {pathToFileURL} from 'node:url';
await build({entryPoints:['lib/technical-language.ts'],outfile:'.wrangler/checks/technical-language.mjs',bundle:true,platform:'node',format:'esm',logLevel:'silent'});
const {normalizeTechnicalLanguage}=await import(pathToFileURL(process.cwd()+'/.wrangler/checks/technical-language.mjs').href);
const source={technical:{updates:[{id:'one',component:'侧舱入口/焦炭',description:'前角勺和家具改善流量调节',reason:'镜子停留与gaitor',primaryReason:'Performance - Flow Conditioning'}]},meta:{round:18},powerUnit:{count:4}};
const result=normalizeTechnicalLanguage(source);assert.equal(source.technical.updates[0].component,'侧舱入口/焦炭');
assert.equal(result.technical.updates[0].component,'侧箱进气口／可乐瓶区域');assert(!/家具|焦炭|镜子停留|gaitor/.test(JSON.stringify(result)));
assert.equal(result.technical.updates[0].primaryReason,source.technical.updates[0].primaryReason);assert.deepEqual(result.meta,source.meta);assert.deepEqual(result.powerUnit,source.powerUnit);
console.log('Technical language: known mistranslations corrected without changing original identifiers, English reasons or numeric data.');
