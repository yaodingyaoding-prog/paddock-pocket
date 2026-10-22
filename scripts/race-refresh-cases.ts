import assert from 'node:assert/strict';
import { WeatherService, WeatherController, OpenMeteoRepository, WeatherError, type WeatherEntry } from '../lib/weather-service';
import { readFollowing, toggleFollowing } from '../lib/following';
import { providerError } from '../lib/auth/SupabaseAccountRepository';
import { AuthApiError } from '@supabase/supabase-js';
import { AccountError } from '../lib/auth/contracts';
import { createPageMotion } from '../lib/page-motion';
import { contentTransition } from '../lib/content-motion';
import { pruneClientCache } from '../lib/client-cache';

const dataCache=new Map([['paddock-cache',JSON.stringify({storedAt:1})],['paddock-weather-v2-old',JSON.stringify({fetchedAt:1})],['paddock-weather-v2-fresh',JSON.stringify({fetchedAt:100000000})],['paddock-theme','"forest"'],['paddock-following-v1','{"driverIds":["a"]}'],['sb-account','private-session-fixture']]);
pruneClientCache({get length(){return dataCache.size;},key:i=>[...dataCache.keys()][i],getItem:k=>dataCache.get(k)||null,removeItem:k=>{dataCache.delete(k);}},100000100);
assert(!dataCache.has('paddock-cache')&&!dataCache.has('paddock-weather-v2-old'),'Expired disposable data is pruned');
assert(dataCache.has('paddock-weather-v2-fresh')&&dataCache.has('paddock-following-v1')&&dataCache.has('paddock-theme')&&dataCache.has('sb-account'),'Fresh weather, user settings and sessions survive cleanup');

let plainCommits=0;
const plainMotion=createPageMotion({enabled:()=>false,start:()=>{throw Error('must not start');},signal:()=>{}});
plainMotion(()=>plainCommits++);assert.equal(plainCommits,1,'Reduced-motion/unsupported browsers still navigate');
const fallbackMotion=createPageMotion({enabled:()=>true,start:()=>{throw Error('capture unavailable');},signal:()=>{}});
fallbackMotion(()=>plainCommits++);assert.equal(plainCommits,2,'A capture failure cannot block navigation');
const callbacks:Array<()=>void>=[],finished:Array<()=>void>=[],commits:string[]=[];
let skips=0;
const rapidMotion=createPageMotion({enabled:()=>true,signal:()=>{},start:update=>{callbacks.push(update);return {ready:Promise.resolve(),finished:new Promise<void>(resolve=>finished.push(resolve)),skipTransition:()=>{skips++;}};}});
rapidMotion(()=>commits.push('old'));rapidMotion(()=>commits.push('latest'));
callbacks[0]();callbacks[1]();callbacks[1]();finished.forEach(resolve=>resolve());
assert.deepEqual(commits,['latest'],'Rapid navigation commits only the most recent destination, once');assert.equal(skips,1);
let recovered=0;
const rejectedMotion=createPageMotion({enabled:()=>true,signal:()=>{},start:()=>({ready:Promise.reject(Error('snapshot rejected')),finished:Promise.reject(Error('transition interrupted')),skipTransition:()=>{}})});
rejectedMotion(()=>recovered++);
await new Promise<void>(resolve=>queueMicrotask(()=>queueMicrotask(resolve)));
assert.equal(recovered,1,'An asynchronously interrupted capture still commits navigation');

const phases:Array<{finish:()=>void;reject:(e:Error)=>void}>=[];
let liveCommits=0,committedStyles=0;
const surface={animate:()=>{let finish!:()=>void,reject!:(e:Error)=>void;const finished=new Promise<void>((resolve,fail)=>{finish=resolve;reject=fail;});phases.push({finish,reject});return {finished,cancel:()=>reject(Error('superseded')),commitStyles:()=>{committedStyles++;}};}};
const interrupted=contentTransition(()=>liveCommits++,()=>surface,18);
interrupted.skipTransition();await interrupted.finished;
assert.equal(liveCommits,0,'Cancelling an outgoing pane cannot commit its obsolete destination');
assert.equal(committedStyles,1,'Interruption preserves the current visual position before cancellation');
const live=contentTransition(()=>liveCommits++,()=>surface,18);
assert.equal(liveCommits,0,'Outgoing content remains live until its short exit completes');
phases.at(-1)!.finish();await Promise.resolve();
assert.equal(liveCommits,1,'The route commits between exit and entrance, once');
phases.at(-1)!.finish();await live.finished;

const old = readFollowing(null, 'driver-a');
assert.deepEqual(old, { driverIds: ['driver-a'], teamIds: [] });
let follows = toggleFollowing(old, 'driverIds', 'driver-b');
follows = toggleFollowing(follows, 'teamIds', 'ferrari');
assert.deepEqual(follows, { driverIds: ['driver-a', 'driver-b'], teamIds: ['ferrari'] });
assert.deepEqual(toggleFollowing(follows, 'driverIds', 'driver-a'), { driverIds: ['driver-b'], teamIds: ['ferrari'] });
const full=toggleFollowing(follows,'driverIds','driver-c');
assert.deepEqual(toggleFollowing(full,'driverIds','driver-d'),full,'Only three personal podium seats are allowed');
assert.deepEqual(readFollowing({driverIds:['a','b','c','d'],teamIds:[]}).driverIds,['a','b','c']);
assert.deepEqual(readFollowing({ driverIds: ['a','a','<script>',null], teamIds: false }), { driverIds: ['a'], teamIds: [] });
assert.throws(() => providerError(new AuthApiError('fixture', 429, 'over_email_send_rate_limit')), (error: unknown) => error instanceof AccountError && error.code === 'PROVIDER_EMAIL_LIMITED' && !error.retryAfter);
assert.throws(() => providerError(new AuthApiError('fixture', 429, 'over_request_rate_limit')), (error: unknown) => error instanceof AccountError && error.code === 'PROVIDER_REQUEST_LIMITED');

const location = '-37.8497,144.968';
let now = 1000000000, calls = 0, fail = false;
const fixture = { timezone: 'Australia/Melbourne', current: { time: 1, temperature_2m: 20 }, hourly: { time: [1,3601], temperature_2m:[20,21], apparent_temperature:[19,20], relative_humidity_2m:[60,61], wind_speed_10m:[10,11], precipitation_probability:[0,10], weather_code:[0,1] } };
const saved = new Map<string, WeatherEntry>();
const service = new WeatherService({ get: async () => { calls++; if (fail) throw new WeatherError('WEATHER_NETWORK'); return fixture; } }, { get: async key => saved.get(key), put: async (key, entry) => { saved.set(key, entry); } }, () => now);
const replies = await Promise.all([service.get(location), service.get(location), service.get(location)]);
assert.equal(calls,1); assert.equal(replies[0].stale,false);
await service.get(location); assert.equal(calls,1);
now += 300001; fail = true;
const stale = await service.get(location); assert.equal(stale.stale,true); assert.equal(stale.fetchedAt,1000000000);
await service.get(location); assert.equal(calls,2, 'An outage has a one minute backoff');
now += 6*3600000;
await assert.rejects(service.get(location), WeatherError);
await assert.rejects(service.get('90,180'), (error: unknown) => error instanceof WeatherError && error.status === 400);
const controller = new WeatherController(service);
assert.equal((await controller.get(new Request('https://example.test/api/weather?location=https://evil.test'))).status,400);
const valid = new OpenMeteoRepository(async () => Response.json(fixture));
assert.equal((await valid.get(location)).current.temperature_2m,20);
for (const [request, code] of [
  [async () => new Response('',{status:429}), 'WEATHER_UPSTREAM_LIMITED'],
  [async () => Response.json({current:{}}), 'WEATHER_FORMAT'],
  [async () => Response.json({...fixture,hourly:{...fixture.hourly,weather_code:[1]}}), 'WEATHER_FORMAT'],
  [async () => {throw new DOMException('fixture','TimeoutError');}, 'WEATHER_TIMEOUT'],
] as const) await assert.rejects(new OpenMeteoRepository(request).get(location), (error: unknown) => error instanceof WeatherError && error.code === code);
console.log('Race refresh: multi-follow migration/independence, distinct provider limits, weather validation, coalescing, fresh cache, stale age and failure backoff passed.');
