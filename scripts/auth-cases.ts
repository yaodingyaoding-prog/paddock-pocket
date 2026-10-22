import assert from 'node:assert/strict';
import { unifiedAuthConfig, type AuthEnvironment } from '../lib/auth/config';
import { AccountError, type AccountIdentity, type AccountRepository } from '../lib/auth/contracts';
import { AccountCookies, RecoveryGrant } from '../lib/auth/cookies';
import { AccountService } from '../lib/auth/accountService';
import { AccountController } from '../lib/auth/AccountController';
import { SupabaseAccountRepository } from '../lib/auth/SupabaseAccountRepository';
import { accountProtection, protectedAccountPath } from '../lib/auth/protection';
import { safeReturnPath } from '../lib/auth/paths';

const origin = 'https://f1.xiaodinglab.com';
const env: AuthEnvironment = {
  AUTH_MODE: 'required', AUTH_BASE_URL: origin,
  SUPABASE_URL: 'https://test-project.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_only_not_a_real_key',
  AUTH_SESSION_SECRET: 'test-only-session-secret-1234567890123456',
  AUTH_IP_LIMITER: { limit: async () => ({ success: true }) },
  AUTH_EMAIL_LIMITER: { limit: async () => ({ success: true }) },
};
const config = unifiedAuthConfig(env);
const user: AccountIdentity = { id: 'test-user', email: 'fan@example.test', name: 'Race Fan', verified: true };
class FakeRepository implements AccountRepository {
  user: AccountIdentity | null = null;
  calls: string[] = [];
  async current() { return this.user; }
  async login(email: string, password: string) { this.calls.push('login'); if (password === 'wrong') throw new AccountError('INVALID_CREDENTIALS', '邮箱或密码不正确。', 401); this.user = { ...user, email }; return this.user; }
  async register() { this.calls.push('register'); }
  async resend() { this.calls.push('resend'); }
  async recover() { this.calls.push('recover'); }
  async verify() { this.calls.push('verify'); this.user = user; return user; }
  async updatePassword() { this.calls.push('update-password'); }
  async logout(all = false) { this.calls.push(all ? 'logout-all' : 'logout'); this.user = null; }
  clearSession() { this.user = null; }
}
function setup(cookie = '', environment = env) {
  const request = new Request(origin + '/', { headers: { cookie } });
  const resolved = unifiedAuthConfig(environment);
  const cookies = new AccountCookies(request, resolved);
  const repository = new FakeRepository();
  const recovery = new RecoveryGrant(cookies, resolved.sessionSecret);
  const service = new AccountService(resolved, resolved.configured ? repository : null, cookies, recovery);
  return { config: resolved, cookies, repository, recovery, service, controller: new AccountController(resolved, service, cookies, environment) };
}
function post(action: string, input: unknown, headers: Record<string, string> = {}) {
  return new Request(origin + '/api/auth/' + action, { method: 'POST', headers: { origin, 'content-type': 'application/json', ...headers }, body: JSON.stringify(input) });
}
function requestCookies(response: Response) {
  return response.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
}
let assertions = 0;
function check(value: unknown, message: string) { assertions++; assert.ok(value, message); }

check(config.configured, 'Complete server configuration is ready');
check(!unifiedAuthConfig({ AUTH_MODE: 'required' }).configured, 'Missing provider configuration is not ready');
check(!unifiedAuthConfig({ ...env, SUPABASE_URL: 'https://attacker.example' }).configured, 'Provider destinations are validated');
check(!unifiedAuthConfig({ ...env, SUPABASE_PUBLISHABLE_KEY: 'sb_secret_this_must_not_be_used_as_a_publishable_key' }).configured, 'Administrative keys are not accepted as client keys');
check(unifiedAuthConfig({ ...env, AUTH_MODE: 'require' }).required && !unifiedAuthConfig({ ...env, AUTH_MODE: 'require' }).configured, 'A misspelled access mode fails closed');
for (const path of ['https://evil.test', '//evil.test', '/\\evil.test', '/login', '/#discover\nLocation:evil', '/#discover/%2f%2fevil']) check(safeReturnPath(path) === '/#schedule', 'External or malformed return paths are rejected');
check(safeReturnPath('/#discover/replays') === '/#discover/replays', 'Valid app return path preserved');
for (const path of ['/login', '/auth/confirm', '/privacy', '/api/auth/session', '/favicon.svg']) check(!protectedAccountPath(path), 'Authentication and necessary public assets are reachable');
for (const path of ['/', '/api/data', '/api/tools', '/api/data.json']) check(protectedAccountPath(path), 'Business pages and APIs are protected');

const anonymous = setup();
let response = await accountProtection(new Request(origin + '/api/data'), anonymous);
check(response?.status === 401, 'Anonymous data access is denied');
check(response?.headers.get('Cache-Control')?.includes('no-store'), 'Auth denial is never publicly cached');
response = await accountProtection(new Request(origin + '/'), anonymous);
check(response?.status === 307 && response.headers.get('Location')?.startsWith('/login'), 'Anonymous document redirects to login');
anonymous.repository.user = user;
check(await accountProtection(new Request(origin + '/api/data'), anonymous) === null, 'Verified authenticated request proceeds');
anonymous.repository.user = { ...user, verified: false };
check((await accountProtection(new Request(origin + '/api/data'), anonymous))?.status === 401, 'Unverified account cannot access data');
const disabled = setup('', { ...env, AUTH_MODE: 'off' });
check(await accountProtection(new Request(origin + '/api/data'), disabled) === null, 'Explicit staged mode preserves existing access');
const missing = setup('', { AUTH_MODE: 'required' });
check((await accountProtection(new Request(origin + '/api/data'), missing))?.status === 503, 'Missing required configuration fails closed');
const failure = setup();
failure.repository.current = async () => { throw new AccountError('AUTH_UNAVAILABLE', 'unavailable', 503); };
check((await accountProtection(new Request(origin + '/api/data'), failure))?.status === 503, 'Provider outage never opens anonymous access');

const account = setup();
response = await account.controller.post(post('login', { email: 'FAN@example.test', password: '123456789012', remember: false, next: 'https://evil.test' }), 'login');
const loggedIn = await response.json() as { next: string; user: { email: string; verified?: boolean } };
check(response.status === 200 && loggedIn.next === '/#schedule', 'Login validates credentials and limits return paths');
check(loggedIn.user.email === 'fan@example.test', 'Email normalized consistently');
check(!JSON.stringify(loggedIn).includes('123456789012') && !('verified' in loggedIn.user), 'Password and internal flags are not returned');
check(response.headers.getSetCookie().every(item => /HttpOnly/i.test(item) && /Secure/i.test(item) && /SameSite=Lax/i.test(item)), 'Cookies are HttpOnly, Secure and SameSite');
check(response.headers.getSetCookie().some(item => item.startsWith('paddock-remember=0') && !/Max-Age=/i.test(item)), 'Non-persistent sign-in uses a session cookie');
response = await account.controller.post(post('login', { email: 'fan@example.test', password: 'wrong' }), 'login');
check(response.status === 401, 'Invalid credentials remain an authentication error');
response = await account.controller.post(post('login', { email: 'fan@example.test', password: '123456789012' }, { origin: 'https://evil.test' }), 'login');
check(response.status === 403, 'Cross-origin sign-in is rejected');
response = await account.controller.post(post('register', { name: 'Fan', email: 'fan@example.test', password: 'short' }), 'register');
check(response.status === 400, 'Five-character registration password is rejected before provider call');
response = await account.controller.post(post('register', { name: 'Fan', email: 'fan@example.test', password: '123456' }), 'register');
check(response.status === 200 && account.repository.calls.includes('register'), 'Six-character registration password reaches the repository');
const duplicate = setup();
duplicate.repository.register = async () => { throw new AccountError('ACCOUNT_EXISTS', 'existing', 400); };
response = await duplicate.controller.post(post('register', { name: 'Fan', email: 'fan@example.test', password: '123456789012' }), 'register');
check(response.status === 200 && (await response.json() as { message: string }).message.includes('请检查邮箱'), 'Registration response does not disclose an existing account');
response = await account.controller.post(new Request(origin + '/api/auth/login', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: '{broken' }), 'login');
check(response.status === 400, 'Malformed JSON produces a controlled error');
response = await account.controller.post(post('login', { oversized: 'x'.repeat(9000) }), 'login');
check(response.status === 413, 'Oversized form bodies are bounded');
response = await account.controller.post(post('unknown', {}), 'unknown');
check(response.status === 404, 'Unsupported actions are rejected');
response = await account.controller.post(post('reset', { password: 'new-password-123456' }), 'reset');
check(response.status === 403 && !account.repository.calls.includes('update-password'), 'A login alone cannot authorize password recovery');

const recovery = setup();
response = await recovery.controller.post(post('verify', { tokenHash: 'a'.repeat(64), type: 'recovery' }), 'verify');
check(response.status === 200 && (await response.json() as { next: string }).next === '/reset-password', 'Recovery email verification authorizes reset form');
const grantCookies = requestCookies(response);
const recovered = setup(grantCookies);
recovered.repository.user = user;
check(await recovered.recovery.permits(user.id), 'Signed recovery grant survives a new request');
check(!await recovered.recovery.permits('other-user'), 'Recovery grant is bound to its account');
const tampered = setup(grantCookies.replace('paddock-recovery=', 'paddock-recovery=x'));
check(!await tampered.recovery.permits(user.id), 'Tampered recovery grants are rejected');
const expiredGrant = new RecoveryGrant(recovered.cookies, config.sessionSecret, () => Date.now() + 700000);
check(!await expiredGrant.permits(user.id), 'Expired recovery grants are rejected');
response = await recovered.controller.post(post('reset', { password: 'short' }), 'reset');
check(response.status === 400 && !recovered.repository.calls.includes('update-password'), 'Five-character recovery password is rejected');
response = await recovered.controller.post(post('reset', { password: '123456' }), 'reset');
check(response.status === 200 && recovered.repository.calls.includes('update-password') && recovered.repository.calls.includes('logout-all'), 'Recovery updates password and revokes refresh sessions');
check(response.headers.getSetCookie().some(item => item.startsWith('paddock-recovery=;') && /Max-Age=0/i.test(item)), 'Recovery authorization cleared after reset');
const verification = setup();
response = await verification.controller.post(post('verify', { tokenHash: 'a'.repeat(64), type: 'signup' }), 'verify');
check(response.status === 200 && (await response.json() as { next: string }).next === '/login?verified=1' && verification.repository.calls.includes('logout'), 'Signup verification returns to explicit login');

const limited = setup('', { ...env, AUTH_EMAIL_LIMITER: { limit: async () => ({ success: false }) } });
response = await limited.controller.post(post('forgot', { email: 'fan@example.test' }), 'forgot');
check(response.status === 429 && response.headers.get('Retry-After') === '60' && !limited.repository.calls.length, 'Mail throttling prevents provider calls');
const noLimiter = setup('', { ...env, AUTH_IP_LIMITER: undefined });
response = await noLimiter.controller.post(post('register', { name: 'Fan', email: 'fan@example.test', password: '123456789012' }), 'register');
check(response.status === 503, 'Production auth refuses requests without rate limit bindings');

// Exercise the real official SDK + cookie adapter against an isolated HTTP fixture.
const sdkCookies = new AccountCookies(new Request(origin + '/'), config);
const sdkUser = { id: '11111111-1111-4111-8111-111111111111', email: 'fan@example.test', aud: 'authenticated', role: 'authenticated', email_confirmed_at: new Date().toISOString(), created_at: new Date().toISOString(), app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: { name: 'Race Fan' } };
const base64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
const access = base64({ alg: 'HS256', typ: 'JWT' }) + '.' + base64({ sub: sdkUser.id, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 }) + '.test-signature';
const sdkCalls: string[] = [];
const fixtureFetch: typeof fetch = async input => {
  const url = String(input);
  sdkCalls.push(url);
  if (url.includes('/token?')) return Response.json({ access_token: access, refresh_token: 'fixture-refresh-token', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user: sdkUser });
  if (url.endsWith('/user')) return Response.json(sdkUser);
  throw new Error('Unexpected fixture endpoint');
};
const sdk = new SupabaseAccountRepository(config, sdkCookies, fixtureFetch);
const sdkIdentity = await sdk.login('fan@example.test', 'fixture-password-123');
const sdkResponse = sdkCookies.apply(Response.json({ user: sdkIdentity }));
check(sdkIdentity.verified && sdkCalls.some(url => url.includes('grant_type=password')), 'Official SDK calls the password endpoint and checks verified email');
check(sdkResponse.headers.getSetCookie().some(item => item.startsWith('sb-') && /HttpOnly/i.test(item) && /Secure/i.test(item)), 'Real SDK session stored only in protected cookies');
check(!JSON.stringify(await sdkResponse.json()).includes('fixture-refresh-token'), 'Session tokens never enter the JSON account response');
check((await sdk.current())?.id === sdkUser.id, 'Session identity is checked against the provider');

const stored = sdkCookies.all().find(item => item.name.startsWith('sb-') && item.name.includes('auth-token'));
check(Boolean(stored), 'SDK persisted a session cookie');
const expiredAccess = base64({ alg: 'HS256', typ: 'JWT' }) + '.' + base64({ sub: sdkUser.id, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) - 120 }) + '.test-signature';
const expiredSession = { access_token: expiredAccess, refresh_token: 'fixture-old-refresh', token_type: 'bearer', expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) - 120, user: sdkUser };
const refreshCookie = `${stored!.name}=${encodeURIComponent('base64-' + Buffer.from(JSON.stringify(expiredSession)).toString('base64url'))}; paddock-remember=0`;
const refreshedCookies = new AccountCookies(new Request(origin + '/', { headers: { cookie: refreshCookie } }), config);
const refreshCalls: string[] = [];
const refreshingFetch: typeof fetch = async input => {
  refreshCalls.push(String(input));
  return fixtureFetch(input);
};
const refreshSdk = new SupabaseAccountRepository(config, refreshedCookies, refreshingFetch);
check((await refreshSdk.current())?.id === sdkUser.id && refreshCalls.some(url => url.includes('grant_type=refresh_token')), 'Expired access tokens are renewed by the SDK and verified with the provider');
const refreshedResponse = refreshedCookies.apply(Response.json({ ok: true }));
check(refreshedResponse.headers.getSetCookie().some(item => item.startsWith('sb-') && !/Max-Age=/i.test(item)), 'Refresh preserves non-persistent sign-in');

const logoutCookies = new AccountCookies(new Request(origin + '/', { headers: { cookie: requestCookies(sdkResponse) } }), config);
const failingLogoutFetch: typeof fetch = async input => String(input).includes('/logout') ? Response.json({ code: 'unexpected_failure', msg: 'fixture provider failure' }, { status: 500 }) : fixtureFetch(input);
const logoutSdk = new SupabaseAccountRepository(config, logoutCookies, failingLogoutFetch);
await assert.rejects(() => logoutSdk.logout(), AccountError);
check(!logoutCookies.all().some(item => item.name.startsWith('sb-')), 'Local credentials clear even if remote logout fails');
console.log(`Authentication: ${assertions} checks passed (service, controller, access protection, recovery grants, limits and real SDK cookie integration).`);
