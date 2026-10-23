import assert from 'node:assert/strict';
const base = process.argv[2] || 'http://127.0.0.1:5177';
assert.match(base, /^http:\/\/(127\.0\.0\.1|localhost):\d+$/, 'Use a local preview server for these tests');
async function request(path, init = {}) {
  return fetch(base + path, { ...init, redirect: 'manual', signal: AbortSignal.timeout(18000) });
}
const session = await request('/api/auth/session');
assert.equal(session.status, 200);
const state = await session.json();
assert.equal(state.enabled, true, 'Local preview must use AUTH_MODE=required');
assert.equal(state.user, null, 'Tests run without a real user session');
assert.match(session.headers.get('cache-control'), /no-store/);
const home = await request('/');
assert.equal(home.status, 200, 'Guest home is public');
assert.equal(home.headers.get('location'), null);
for (const path of ['/api/private', '/account']) {
  const response = await request(path);
  assert.equal(response.status, path.startsWith('/api/') ? (state.configured ? 401 : 503) : 307);
  assert.match(response.headers.get('cache-control'), /no-store/);
}
const rsc = await request('/?_rsc=account-check', { headers: { RSC: '1' } });
if (rsc.status === 307) {
  assert.equal(rsc.headers.get('location'), '/?_rsc', 'Vinext may canonicalize only the RSC cache query');
  assert.equal((await request('/?_rsc', { headers: { RSC: '1' } })).status, 200, 'Canonical RSC reads are public');
} else assert.equal(rsc.status, 200, 'Guest RSC requests render the public home');
const raceData = await request('/api/data?resource=seasons');
assert.equal(raceData.status, 200, 'Public race reads work without a session');
for (const method of ['GET', 'POST', 'DELETE']) {
 const avatar = await request('/api/auth/avatar', { method, headers: { Origin: base, 'Content-Type': 'image/webp' }, ...(method === 'POST' ? { body: new Uint8Array([1,2,3]) } : {}) });
 assert.equal(avatar.status, state.configured ? 401 : 503, 'Avatar ownership remains enforced');
 assert.match(avatar.headers.get('cache-control'), /no-store/);
}
const login = await request('/login');
assert.equal(login.status, 200);
assert.match(login.headers.get('cache-control'), /no-store/);
assert.equal(login.headers.get('referrer-policy'), 'no-referrer');
const html = await login.text();
assert.match(html, /进入你的围场/);
assert.ok(!html.includes('newpassword') && !html.includes('drivers_standings_2026_zh'), 'Login HTML does not embed business snapshots');
for (const path of ['/register', '/forgot-password', '/reset-password', '/auth/confirm', '/privacy']) assert.equal((await request(path)).status, 200);
const foreign = await request('/api/auth/login', { method: 'POST', headers: { Origin: 'https://untrusted.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'fixture@example.test', password: 'not-submitted-to-provider' }) });
assert.equal(foreign.status, 403, 'Cross-origin credentials are rejected before the provider');
const broken = await request('/api/auth/login', { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: '{invalid' });
assert.equal(broken.status, 400, 'Invalid form data has a controlled response');
console.log('Local Worker HTTP checks passed: login pages, public documents, RSC and race APIs, private routes and avatar ownership, private cache headers, origin validation and invalid forms. No real users or emails created.');
