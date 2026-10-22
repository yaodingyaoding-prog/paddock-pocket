import { AccountError } from './contracts';
import { safeReturnPath } from './validation';
import type { AuthConfig } from './config';
import type { AccountService } from './accountService';
import type { AccountCookies } from './cookies';

const publicPages = new Set(['/login', '/register', '/forgot-password', '/reset-password', '/auth/confirm', '/privacy']);
export function protectedAccountPath(pathname: string) {
  if (publicPages.has(pathname) || pathname === '/api/auth/session' || pathname.startsWith('/api/auth/')) return false;
  // Build assets and attribution records remain public; business APIs never do.
  if (pathname.startsWith('/api/')) return true;
  if (pathname.startsWith('/_next/') || /\.[a-z0-9]+$/i.test(pathname)) return false;
  return true;
}
export async function accountProtection(request: Request, context: { config: AuthConfig; cookies: AccountCookies; service: Pick<AccountService, 'status'> }) {
  const { config, cookies, service } = context;
  const url = new URL(request.url);
  if (!config.required || !protectedAccountPath(url.pathname)) return null;
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
