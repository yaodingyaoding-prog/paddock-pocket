import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {pathToFileURL} from 'node:url';
await build({entryPoints:['lib/race-events.ts'],outfile:'.wrangler/checks/race-events.mjs',bundle:true,platform:'node',format:'esm',logLevel:'silent'});
const {normalizeRaceEvents,defaultEventRace,visibleRaceEvents,raceEventExplanation}=await import(pathToFileURL(process.cwd()+'/.wrangler/checks/race-events.mjs').href);
const session={session_key:42,session_name:'Race',date_start:'2026-11-08T17:00:00Z',date_end:'2026-11-08T19:00:00Z',year:2026,meeting_key:5};
const drivers=[{driver_number:23,name_acronym:'ALB',full_name:'Alex Albon'},{driver_number:27,name_acronym:'HUL',full_name:'Nico Hulkenberg'}];
const row=(message,date='2026-11-08T18:00:00Z',extra={})=>({message,date,session_key:42,meeting_key:5,lap_number:42,category:'Other',...extra});
const records=[
 row('YELLOW IN TRACK SECTOR 1','2026-11-08T17:30:00Z',{flag:'YELLOW',sector:1}),
 row('DOUBLE YELLOW IN TRACK SECTOR 2','2026-11-08T17:30:00Z',{flag:'DOUBLE YELLOW',sector:2}),
 row('FIA STEWARDS: 5 SECOND TIME PENALTY FOR CAR 23 (ALB) - REJOINING UNSAFELY'),
 row('FIA STEWARDS: PENALTY SERVED - 5 SECOND TIME PENALTY FOR CAR 23 (ALB)','2026-11-08T18:04:00Z'),
 row('CAR 27 (HUL) STOPPED AT TURN 4','2026-11-08T18:09:50Z'),
 row('SAFETY CAR DEPLOYED','2026-11-08T18:10:00Z',{category:'SafetyCar'}),
 row('SAFETY CAR IN THIS LAP','2026-11-08T18:15:00Z',{category:'SafetyCar'}),
 row('CAR 27 (HUL) UNDER INVESTIGATION - CAUSING A COLLISION','2026-11-08T18:20:00Z'),
 row('CAR 27 (HUL) NO FURTHER ACTION - CAUSING A COLLISION','2026-11-08T18:21:00Z'),
 row('RED FLAG','2026-11-08T18:30:00Z',{flag:'RED'}),
 row('3 PLACE GRID PENALTY FOR CAR 27 (HUL) - IMPEDING','2026-11-08T18:40:00Z'),
 row('YELLOW FLAG INFRINGEMENT NOTED FOR CAR 23 (ALB)','2026-11-08T18:41:00Z'),
];
const events=normalizeRaceEvents(records,[session],drivers);
assert.equal(events.filter(e=>e.kind==='yellow').length,1,'Simultaneous yellow mini-sectors form one notice');
assert.equal(events.find(e=>e.kind==='yellow').title,'双黄旗');
assert.deepEqual(events.find(e=>e.kind==='yellow').sectors,[1,2]);
assert.equal(events.filter(e=>e.kind==='penalty').length,2,'Served notices and investigations are not extra penalties');
const penalty=events.find(e=>e.title==='加罚 5 秒');
assert.equal(penalty.drivers[0].number,23);assert.equal(penalty.reason,'不安全返回赛道');assert.equal(penalty.servedAt,'2026-11-08T18:04:00Z');
const safety=events.find(e=>e.kind==='safety');
assert.equal(safety.title,'安全车出动');assert.equal(safety.cause,null,'A nearby stopped car is not proof of causation');
assert.ok(safety.related.some(e=>e.message.includes('CAR 27')));assert.equal(safety.endNotice,'2026-11-08T18:15:00Z');
assert.equal(events.find(e=>e.isGridPenalty).title,'罚退 3 位');
assert.equal(normalizeRaceEvents([row('5 GRID PLACE PENALTY FOR CAR 27 (HUL)')],[session],drivers)[0].title,'罚退 5 位');
assert.equal(events.filter(e=>e.kind==='red').length,1);
assert.equal(normalizeRaceEvents([...records,records[2]],[session],drivers).length,events.length,'Exact duplicate feed entries are ignored');
const cancelled=normalizeRaceEvents([records[2],row('5 SECOND TIME PENALTY FOR CAR 23 (ALB) - PENALTY WITHDRAWN','2026-11-08T18:35:00Z')],[session],drivers);
assert.equal(cancelled.length,1);assert.equal(cancelled[0].status,'cancelled');
const repeated=[
 row('5 SECOND TIME PENALTY FOR CAR 23 (ALB) - TRACK LIMITS (14:01:00)','2026-11-08T18:01:00Z'),
 row('5 SECOND TIME PENALTY FOR CAR 23 (ALB) - SPEEDING IN THE PIT LANE (14:02:00)','2026-11-08T18:02:00Z'),
 row('PENALTY SERVED - 5 SECOND TIME PENALTY FOR CAR 23 (ALB) (14:01:00)','2026-11-08T18:03:00Z'),
 row('PENALTY SERVED - 5 SECOND TIME PENALTY FOR CAR 23 (ALB) (14:02:00)','2026-11-08T18:04:00Z'),
 row('PENALTY SERVED - 5 SECOND TIME PENALTY FOR CAR 23 (ALB) (14:01:00)','2026-11-08T18:05:00Z'),
];
const reconciled=normalizeRaceEvents(repeated,[session],drivers);
assert.equal(reconciled.find(e=>e.reason==='超出赛道界限').servedAt,'2026-11-08T18:03:00Z','Serving must reference the correct original penalty');
assert.equal(reconciled.find(e=>e.reason==='维修区超速').servedAt,'2026-11-08T18:04:00Z');
const ambiguous=normalizeRaceEvents([...repeated.slice(0,2),row('PENALTY SERVED - 5 SECOND TIME PENALTY FOR CAR 23 (ALB)','2026-11-08T18:03:00Z')],[session],drivers);
assert.ok(ambiguous.every(e=>!e.servedAt),'An ambiguous execution notice must not be assigned by guesswork');
const reasonMatched=normalizeRaceEvents([...repeated.slice(0,2),row('PENALTY SERVED - 5 SECOND TIME PENALTY FOR CAR 23 (ALB) - TRACK LIMITS','2026-11-08T18:03:00Z')],[session],drivers);
assert.equal(reasonMatched.find(e=>e.reason==='超出赛道界限').servedAt,'2026-11-08T18:03:00Z');
const explicit=normalizeRaceEvents([row('SAFETY CAR DEPLOYED DUE TO CAR 27 (HUL) STOPPED AT TURN 4','2026-11-08T18:10:00Z',{category:'SafetyCar'})],[session],drivers);
assert.ok(explicit[0].cause?.includes('CAR 27'),'An explicit cause may be retained');
const flagCauses=normalizeRaceEvents([
 row('RED FLAG DUE TO CAR 27 (HUL) STOPPED AT TURN 4','2026-11-08T18:10:00Z',{flag:'RED'}),
 row('DOUBLE YELLOW IN TRACK SECTOR 2 - DEBRIS ON TRACK AT TURN 8','2026-11-08T18:20:00Z',{flag:'DOUBLE YELLOW',sector:2}),
 row('RED FLAG BECAUSE OF HEAVY RAIN','2026-11-08T18:30:00Z',{flag:'RED'}),
],[session],drivers);
assert.equal(flagCauses.find(e=>e.date.includes('18:10')).cause,'CAR 27 (HUL) STOPPED AT TURN 4','Flag reasons must be retained, not discarded');
assert.equal(raceEventExplanation(flagCauses.find(e=>e.date.includes('18:10')),d=>'车手'+d.number).reason,'原因：车手27 #27 在4号弯停车');
assert.equal(raceEventExplanation(flagCauses.find(e=>e.kind==='yellow')).reason,'原因：8号弯赛道有碎片');
assert.equal(raceEventExplanation(flagCauses.find(e=>e.date.includes('18:30'))).reason,'原因：大雨');
const contextFlags=normalizeRaceEvents([
 row('YELLOW IN TRACK SECTOR 1','2026-11-08T18:10:00Z',{flag:'YELLOW',sector:1,qualifying_phase:2}),
 row('CAR 27 (HUL) SPUN AT TURN 4','2026-11-08T18:09:55Z',{qualifying_phase:2}),
 row('CAR 23 (ALB) CRASHED AT TURN 4','2026-11-08T18:09:56Z',{session_key:99}),
 row('CAR 23 (ALB) STOPPED AT TURN 4','2026-11-08T18:09:57Z',{qualifying_phase:1}),
 row('CAR 23 (ALB) STOPPED AT TURN 4','2026-11-08T18:00:00Z',{qualifying_phase:2}),
 row('RISK OF RAIN IS 80%','2026-11-08T18:09:58Z',{qualifying_phase:2}),
],[session,{...session,session_key:99}],drivers);
assert.equal(contextFlags[0].cause,null,'A nearby spin is not an explicit flag cause');
assert.equal(contextFlags[0].related.length,1,'Related incidents must stay within the same session, phase and time window');
assert.equal(raceEventExplanation(contextFlags[0]).reason,'原因未公布','Sector numbers and rain probability are not reasons');
assert.ok(raceEventExplanation(contextFlags[0]).related.includes('打转'));
assert.ok(raceEventExplanation(contextFlags[0]).related.includes('关联未确认'));
assert.equal(raceEventExplanation(events.find(e=>e.kind==='red')).reason,'原因未公布');
const groupedCauses=normalizeRaceEvents([
 row('YELLOW IN TRACK SECTOR 1','2026-11-08T18:10:00Z',{flag:'YELLOW',sector:1}),
 row('YELLOW IN TRACK SECTOR 2 DUE TO CAR 27 (HUL) STOPPED AT TURN 4','2026-11-08T18:10:00Z',{flag:'YELLOW',sector:2}),
],[session],drivers);
assert.equal(groupedCauses.length,1);assert.equal(groupedCauses[0].cause,'CAR 27 (HUL) STOPPED AT TURN 4');
assert.equal(groupedCauses[0].drivers[0].number,27,'Grouping must retain the driver from a later explicit reason');
assert.equal(raceEventExplanation(groupedCauses[0]).related,null,'Confirmed reasons must not also display speculative context');
assert.equal(normalizeRaceEvents([row('RED FLAG','invalid',{flag:'RED'})],[session],drivers).length,0);
assert.equal(normalizeRaceEvents([row('RED FLAG',undefined,{flag:'RED',session_key:999})],[session],drivers).length,0,'Foreign sessions are not mixed into this weekend');
const qualifying=normalizeRaceEvents([row('CHEQUERED FLAG','2026-11-08T17:20:00Z',{flag:'CHEQUERED',qualifying_phase:1}),row('RED FLAG','2026-11-08T17:30:00Z',{flag:'RED',qualifying_phase:2}),row('CHEQUERED FLAG','2026-11-08T18:00:00Z',{flag:'CHEQUERED',qualifying_phase:3})],[{...session,session_name:'Qualifying'}],drivers);
assert.equal(qualifying[0].phase,'race','The Q1 chequered flag must not make Q2 incidents post-session events');assert.equal(qualifying[0].qualifyingPhase,2);
const races=[{id:'future',schedule:[{type:'MainRace',startDate:'2026-11-22T04:00:00Z',endDate:'2026-11-22T06:00:00Z'}]},{id:'old',schedule:[{type:'MainRace',startDate:'2026-11-01T20:00:00Z',endDate:'2026-11-01T22:00:00Z'}]},{id:'recent',schedule:[{type:'MainRace',startDate:'2026-11-08T17:00:00Z',endDate:'2026-11-08T19:00:00Z'}]}];
assert.equal(defaultEventRace(races,'',Date.parse('2026-11-10T00:00:00Z')).id,'recent');
assert.equal(defaultEventRace(races,'future',Date.parse('2026-11-10T00:00:00Z')).id,'future');
assert.ok(visibleRaceEvents(events,'all',false).some(e=>e.kind==='penalty'),'Collapsed highlights must retain meaningful decisions');
assert.equal(visibleRaceEvents(events,'all',false).length,3);assert.equal(visibleRaceEvents(events,'all',true).length,events.length);
console.log('Race events: flag grouping, penalties, serving/cancellation, driver identity, safety-car causality, session boundaries, selection and compact highlights passed.');
