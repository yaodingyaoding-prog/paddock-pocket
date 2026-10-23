import assert from 'node:assert/strict';
import { defaultPreferences, preferencesSchema, type PreferencesPatch, type PreferencesRecord } from '../lib/preferences';
import { PreferenceSync, type SyncView } from '../lib/preference-sync';
import { legacyPreferences, finishPreferencesMigration } from '../lib/preferences-migration';
import { followingStorageKey, activeFollowingKey, followingOwnerKey } from '../lib/following';
import { PreferencesService, type PreferencesRepository } from '../lib/auth/preferencesService';
import { PreferencesController } from '../lib/auth/PreferencesController';
import { AccountCookies } from '../lib/auth/cookies';
import { unifiedAuthConfig } from '../lib/auth/config';
import type { AccountIdentity } from '../lib/auth/contracts';

const owner: AccountIdentity = { id: '11111111-1111-4111-8111-111111111111', name: 'Fixture', email: 'fixture@example.test', verified: true };
let user: AccountIdentity | null = owner;
const rows = new Map<string, PreferencesRecord>();
const repo: PreferencesRepository & { current(): Promise<AccountIdentity | null> } = {
  async current() { return user; },
  async readPreferences(id) { return structuredClone(rows.get(id) || null); },
  async writePreferences(patch, initialize) {
    const previous = rows.get(user!.id);
    if (initialize && previous) return structuredClone(previous);
    const next = { preferences: { ...(previous?.preferences || defaultPreferences()), ...patch }, revision: (previous?.revision || 0) + 1, updatedAt: new Date().toISOString() };
    rows.set(user!.id, next); return structuredClone(next);
  },
};
const service = new PreferencesService(repo);
const origin = 'https://f1.xiaodinglab.com';
const env = { AUTH_MODE: 'required', AUTH_BASE_URL: origin, SUPABASE_URL: 'https://fixture.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_fixture_abcdefghijklmn', AUTH_SESSION_SECRET: 'fixture-secret-32-characters-long-0000', AUTH_IP_LIMITER: { limit: async () => ({ success: true }) } };
const config = unifiedAuthConfig(env);
const controller = new PreferencesController(config, service, new AccountCookies(new Request(origin), config), env);
const patch = (body: unknown, requestOrigin = origin) => new Request(origin + '/api/auth/preferences', { method: 'PATCH', headers: { origin: requestOrigin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
assert.equal((await controller.get()).status, 200);
assert.equal((await controller.patch(patch({ patch: { theme: 'forest', driverIds: ['driver-a'] }, initialize: true }))).status, 200);
assert.equal((await controller.patch(patch({ patch: { theme: 'light' }, initialize: true }))).status, 200);
assert.equal(rows.get(owner.id)!.preferences.theme, 'forest', 'An older device cannot overwrite existing cloud data during migration');
assert.equal((await controller.patch(patch({ patch: { accent: 'coral', timezone: 'America/New_York', teamIds: ['ferrari'] } }))).status, 200);
assert.deepEqual(rows.get(owner.id)!.preferences.driverIds, ['driver-a'], 'Changing appearance preserves follows');
for (const invalid of [{ driverIds: ['a','b','c','d'] }, { driverIds: ['a','a'] }, { timezone: 'not/a-zone' }, { theme: 'unsafe' }, { user_id: 'other' }, {}, { driverIds: ['../outside'] }, { teamIds: Array.from({ length: 31 }, (_, i) => String(i)) }]) assert.equal((await controller.patch(patch({ patch: invalid }))).status, 400);
assert.equal((await controller.patch(patch({ patch: { theme: 'light' } }, 'https://untrusted.example'))).status, 403);
assert.equal((await controller.patch(patch({ patch: { theme: 'light' }, userId: 'other' }))).status, 400);
assert.match((await controller.get()).headers.get('cache-control')!, /no-store/);
user = null;
assert.equal((await controller.get()).status, 401); assert.equal((await controller.patch(patch({ patch: { theme: 'light' } }))).status, 401);
user = { ...owner, id: '22222222-2222-4222-8222-222222222222' };
assert.equal((await service.read()).record, null, 'Another account cannot read this owner’s preferences');
await service.save({ theme: 'ice' }, true); assert.equal(rows.get(owner.id)!.preferences.theme, 'forest');
user = owner;
const map = new Map<string, string>([[followingStorageKey(owner.id), JSON.stringify({ driverIds: ['driver-b'], teamIds: ['mclaren'] })], ['paddock-theme', '"sand"'], ['paddock-accent', '"invalid-old-accent"'], ['paddock-timezone', '"Asia/Tokyo"']]);
const storage = { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => { map.set(key,value); }, removeItem: (key: string) => { map.delete(key); } };
const seed = legacyPreferences(storage, owner.id); assert.equal(seed.theme, 'sand'); assert.equal(seed.accent, 'mint'); assert.equal(seed.timezone, 'Asia/Tokyo'); assert.deepEqual(seed.driverIds, ['driver-b']);
finishPreferencesMigration(storage, owner.id); assert(!map.has(followingStorageKey(owner.id)) && !map.has('paddock-theme'));
map.set(activeFollowingKey, JSON.stringify({ driverIds: ['private-driver'], teamIds: [] })); map.set(followingOwnerKey, 'other-account');
assert.deepEqual(legacyPreferences(storage, owner.id).driverIds, []);

// Two independent device engines share only the remote repository, never local storage.
let remote: PreferencesRecord | null = null;
let failures = false, writes = 0;
const transport = { read: async () => structuredClone(remote), write: async (value: PreferencesPatch, initialize: boolean) => {
  writes++; if (failures) throw new Error('Offline');
  if (initialize && remote) return structuredClone(remote);
  remote = { preferences: { ...(remote?.preferences || defaultPreferences()), ...value }, revision: (remote?.revision || 0) + 1, updatedAt: '2026-10-23T12:00:00Z' }; return structuredClone(remote);
} };
let a!: SyncView, b!: SyncView;
const deviceA = new PreferenceSync(transport, seed, value => { a = value; });
const deviceB = new PreferenceSync(transport, defaultPreferences(), value => { b = value; });
assert.equal(deviceA.change({ theme: 'light' }), false, 'Do not overwrite cloud data before initial load');
await deviceA.refresh(); await deviceB.refresh();
assert.equal(b.preferences.theme, 'sand', 'A fresh device restores theme from the cloud');
deviceA.change({ driverIds: ['hamilton'], teamIds: ['ferrari'] }); await deviceA.flush(); await deviceB.refresh();
assert.deepEqual(b.preferences.driverIds, ['hamilton']); assert.deepEqual(b.preferences.teamIds, ['ferrari']);
deviceB.change({ accent: 'violet', timezone: 'UTC' }); await deviceB.flush(); await deviceA.refresh();
assert.equal(a.preferences.accent, 'violet'); assert.equal(a.preferences.timezone, 'UTC');
deviceA.change({ theme: 'navy' }); deviceB.change({ accent: 'gold' }); await Promise.all([deviceA.flush(), deviceB.flush()]); await Promise.all([deviceA.refresh(), deviceB.refresh()]);
assert.equal(a.preferences.theme, 'navy'); assert.equal(a.preferences.accent, 'gold', 'Independent field edits survive concurrent devices');
failures = true; deviceA.change({ theme: 'plum' }); await assert.rejects(deviceA.flush()); assert.equal(a.status, 'error');
failures = false; await deviceA.refresh(); await deviceB.refresh(); assert.equal(b.preferences.theme, 'plum', 'Retry saves only pending edited fields');
let release!: (value: PreferencesRecord | null) => void;
const deferred = new Promise<PreferencesRecord | null>(resolve => { release = resolve; });
const stale = new PreferenceSync({ ...transport, read: () => deferred }, defaultPreferences(), () => { throw new Error('Disposed account must not publish'); });
const loading = stale.refresh(); stale.dispose(); const count = writes; release(null); await loading; assert.equal(writes, count, 'Logout never initializes the old account after a delayed read');
deviceA.dispose(); deviceB.dispose();
assert.equal(deviceA.change({ theme: 'light' }), false);
// A late read must not erase an edit made while that read was in flight.
let slowRead = false, releaseRead!: (value: PreferencesRecord | null) => void;
const readTransport = { ...transport, read: () => slowRead ? new Promise<PreferencesRecord | null>(resolve => { releaseRead = resolve; }) : transport.read() };
let latest!: SyncView;
const editing = new PreferenceSync(readTransport, defaultPreferences(), value => { latest = value; });
await editing.refresh(); slowRead = true;
const oldRead = editing.refresh(), oldRecord = structuredClone(remote);
editing.change({ accent: 'cyan' }); const saving = editing.flush();
releaseRead(oldRecord); await Promise.all([oldRead, saving]);
assert.equal(latest.preferences.accent, 'cyan'); assert.equal(latest.status, 'synced');
editing.dispose();
// A provider outage before initialization must not trap a user on logout.
const unavailable = new PreferenceSync({ read: async () => { throw new Error('Unavailable'); }, write: transport.write }, defaultPreferences(), () => {});
await assert.rejects(unavailable.refresh()); await unavailable.flush(); assert(!unavailable.hasPending()); unavailable.dispose();
assert(preferencesSchema.safeParse(a.preferences).success);
console.log('Cloud preferences: account ownership, validation, private API, one-time migration, independent devices, partial concurrent writes, failed-save retry and logout isolation passed.');
