import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source=ts.transpileModule(fs.readFileSync('lib/race-replays.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {replayLinks,replayRaceMatches}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const races=JSON.parse(fs.readFileSync('lib/snapshots/grands_prix_2026_zh.json','utf8')).data.items;
for(const race of races){
 const links=replayLinks(2026,race.name);
 const bili=new URL(links.bilibili),tencent=new URL(links.tencent);
 assert.equal(bili.origin,'https://search.bilibili.com');assert.equal(tencent.origin,'https://v.qq.com');
 assert.equal(bili.searchParams.get('keyword'),`F1 2026 ${race.name} 正赛 全场回放`);
 assert.equal(tencent.searchParams.get('q'),bili.searchParams.get('keyword'));
 assert.ok(replayRaceMatches(race,'','race'));
}
const china=races.find(race=>race.name==='中国大奖赛');
assert.ok(replayRaceMatches(china,'中国','sprint'));
assert.equal(replayRaceMatches(china,'不存在的赛道','race'),false);
assert.equal(replayRaceMatches(races[0],'','sprint'),false);
assert.match(replayLinks(2011,'加拿大大奖赛','qualifying').query,/2011 加拿大大奖赛 排位赛/);
assert.match(replayLinks(2020,'萨基尔大奖赛','practice').query,/自由练习赛/);
console.log(`Replay checks passed: ${races.length} race entries, exact season/name/session queries, search and sprint filtering.`);
