import assert from 'node:assert/strict';
import { WeatherService, WeatherController, OpenMeteoRepository, WeatherError, type WeatherEntry } from '../lib/weather-service';
import { readFollowing, toggleFollowing } from '../lib/following';
import { providerError } from '../lib/auth/SupabaseAccountRepository';
import { AuthApiError } from '@supabase/supabase-js';
import { AccountError } from '../lib/auth/contracts';

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
