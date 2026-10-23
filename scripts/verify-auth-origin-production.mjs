import assert from 'node:assert/strict';
const canonical = 'https://f1.xiaodinglab.com', legacy = 'https://xiaodinglab.com';
for (const path of ['/', '/login?next=%2F%23schedule', '/register', '/forgot-password', '/about']) {
  const response = await fetch(legacy + path, { redirect: 'manual', signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, 307, 'Legacy document must move to the canonical site: ' + path);
  assert.equal(response.headers.get('location'), canonical + path, 'Keep the page and return query on the trusted host');
}
for (const action of ['login', 'register']) {
  for (const origin of [canonical, legacy, 'https://untrusted.example']) {
    const response = await fetch(canonical + '/api/auth/' + action, { method: 'POST', redirect: 'manual', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: '{invalid', signal: AbortSignal.timeout(20000) });
    const reply = await response.json();
    assert.equal(response.status, origin === canonical ? 400 : 403);
    assert.equal(reply.code, origin === canonical ? 'INVALID_INPUT' : 'INVALID_ORIGIN');
  }
}
const legacyPost = await fetch(legacy + '/api/auth/login', { method: 'POST', redirect: 'manual', headers: { Origin: legacy, 'Content-Type': 'application/json' }, body: '{invalid', signal: AbortSignal.timeout(20000) });
assert.equal(legacyPost.status, 403, 'Never redirect credentials to another origin');
assert.equal(legacyPost.headers.get('location'), null);
console.log('Production account origins passed: legacy page redirects, preserved next links, same-origin login/register, rejected foreign origins and no credential replay. No credentials or emails submitted.');
