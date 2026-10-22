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
assert.equal(home.status, 307);
assert.match(home.headers.get('location'), /^\/login\?/);
for (const path of ['/api/data?resource=seasons', '/api/tools?kind=technical']) {
  const response = await request(path);
  assert.equal(response.status, state.configured ? 401 : 503);
  assert.match(response.headers.get('cache-control'), /no-store/);
}
const rsc = await request('/?_rsc=account-check', { headers: { RSC: '1' } });
assert.equal(rsc.status, 307, 'RSC requests do not bypass the document gate');
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
console.log('Local Worker HTTP checks passed: login pages, document and RSC gate, business APIs, private cache headers, origin validation and invalid forms. No real users or emails created.');
