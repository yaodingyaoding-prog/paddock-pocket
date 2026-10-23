import { AccountError } from './contracts';
import { safeReturnPath } from './validation';
import type { AuthConfig } from './config';
import type { AccountService } from './accountService';
import type { AccountCookies } from './cookies';

const publicPages = new Set(['/', '/about', '/login', '/register', '/forgot-password', '/reset-password', '/auth/confirm', '/privacy']);
const publicRaceApis = new Set(['/api/data', '/api/weather', '/api/tools', '/api/race-media']);
export function canonicalDocumentLocation(request: Request, config: AuthConfig): string | null {
  // Move documents before rendering a form; never forward a credential-bearing POST.
  if (!config.required || !config.configured || !['GET', 'HEAD'].includes(request.method)) return null;
  const url = new URL(request.url);
  if (url.origin === config.baseUrl || url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/') || /\.[a-z0-9]+$/i.test(url.pathname)) return null;
  return config.baseUrl + url.pathname + url.search + url.hash;
}
export function protectedAccountPath(pathname: string, method = 'GET') {
  const readOnly = method === 'GET' || method === 'HEAD';
  if (readOnly && (publicRaceApis.has(pathname) || /^\/api\/drivers\/[a-f0-9-]{36}$/i.test(pathname))) return false;
  if (publicPages.has(pathname) || pathname === '/api/auth/session' || pathname.startsWith('/api/auth/')) return false;
  // Only explicit race reads are public. Account controllers enforce ownership themselves.
  if (pathname.startsWith('/api/')) return true;
  if (pathname.startsWith('/_next/') || /\.[a-z0-9]+$/i.test(pathname)) return false;
  return true;
}
export async function accountProtection(request: Request, context: { config: AuthConfig; cookies: AccountCookies; service: Pick<AccountService, 'status'> }) {
  const { config, cookies, service } = context;
  const url = new URL(request.url);
  if (!config.required || !protectedAccountPath(url.pathname, request.method)) return null;
  const api = url.pathname.startsWith('/api/');
  try {
    if (!config.configured) throw new AccountError('NOT_CONFIGURED', '账号服务正在准备中，请稍后再试。', 503);
    if (!api && url.origin !== config.baseUrl) return cookies.apply(new Response(null, { status: 307, headers: { Location: config.baseUrl + url.pathname + url.search } }));
    const status = await service.status();
    if (status.user) return null;
    if (api) return cookies.apply(Response.json({ error: '请先登录围场口袋。', code: 'AUTH_REQUIRED' }, { status: 401 }));
    return cookies.apply(new Response(null, { status: 307, headers: { Location: '/login?next=' + encodeURIComponent(safeReturnPath(url.pathname + url.hash)) } }));
  } catch (error) {
    if (api) return cookies.apply(Response.json({ error: '账号服务暂时不可用，请稍后重试。', code: 'AUTH_UNAVAILABLE' }, { status: 503 }));
    if (!(error instanceof AccountError && error.code === 'NOT_CONFIGURED')) console.error(JSON.stringify({ scope: 'account', operation: 'protect', code: 'AUTH_UNAVAILABLE' }));
    return cookies.apply(new Response(null, { status: 307, headers: { Location: '/login?reason=unavailable' } }));
  }
}
