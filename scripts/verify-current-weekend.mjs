import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {pathToFileURL} from 'node:url';
import {createElement} from 'react';
import {renderToString} from 'react-dom/server';
import {readFileSync} from 'node:fs';

const output='.wrangler/checks/current-weekend-page.mjs';
await build({entryPoints:['app/page.tsx'],outfile:output,bundle:true,packages:'external',platform:'node',format:'esm',jsx:'automatic',loader:{'.css':'empty'},logLevel:'silent'});
const {default:HomePage}=await import(pathToFileURL(process.cwd()+'/'+output).href+'?run='+Date.now());
const realNow=Date.now;
try{
  for(const [date,name] of [
    ['2026-10-24T12:00:00Z','美国大奖赛'],
    ['2026-10-25T22:00:00Z','墨西哥城大奖赛'],
    ['2026-11-08T12:00:00Z','圣保罗大奖赛'],
    ['2026-11-08T19:00:00Z','拉斯维加斯大奖赛'],
    ['2026-12-07T12:00:00Z','阿布扎比大奖赛'],
  ]){
    Date.now=()=>Date.parse(date);
    const html=renderToString(createElement(HomePage));
    const title=html.match(/<h2>([^<]*大奖赛)<\/h2>/)?.[1];
    assert.equal(title,name,'Initial HTML must show the appropriate weekend at '+date+' without waiting for client requests');
  }
}finally{Date.now=realNow;}
const resolverOutput='.wrangler/checks/current-weekend.mjs';
await build({entryPoints:['lib/current-weekend.ts'],outfile:resolverOutput,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
const {currentWeekend}=await import(pathToFileURL(process.cwd()+'/'+resolverOutput).href+'?run='+Date.now());
const snapshot=name=>JSON.parse(readFileSync('lib/snapshots/'+name+'_zh.json','utf8')).data;
const oldNext=snapshot('next_grand_prix'), races=snapshot('grands_prix_2026').items;
const now=Date.parse('2026-11-08T12:00:00Z');
assert.equal(currentWeekend(oldNext,[...races].reverse(),now)?.name,'圣保罗大奖赛','A stale cached Active flag and unsorted calendar cannot select an expired weekend');
const liveNext={...races.find(race=>race.name==='圣保罗大奖赛'),name:'圣保罗大奖赛（更新）'};
assert.equal(currentWeekend(liveNext,races,now)?.name,'圣保罗大奖赛（更新）','The selected weekend keeps the latest next-race details');
assert.equal(currentWeekend(oldNext,[...races,{id:'cancelled',endDate:'2026-11-08T13:00:00Z',status:'Cancelled'}],now)?.name,'圣保罗大奖赛','Cancelled events must not displace the current weekend');
assert.equal(currentWeekend(undefined,[{id:'session-only',schedule:[{endDate:'2026-11-08T19:00:00Z'}]}],now)?.id,'session-only','Session dates support a weekend whose endDate is missing');
assert.equal(currentWeekend(undefined,[],now),undefined,'An empty season must remain empty');
console.log('Current weekend: server first paint, weekend boundaries, stale cache, live details and season-end selection passed.');
