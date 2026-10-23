import { NextResponse, type NextRequest } from 'next/server';
import { accountContext } from './lib/auth/context';
import { accountEnvironment } from './lib/auth/runtime';
import { accountProtection, protectedAccountPath, canonicalDocumentLocation } from './lib/auth/protection';
import { unifiedAuthConfig } from './lib/auth/config';

export async function proxy(request: NextRequest) {
  const environment = accountEnvironment();
  const canonical = canonicalDocumentLocation(request, unifiedAuthConfig(environment));
  if (canonical) {
    const response = NextResponse.redirect(canonical, 307);
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  }
  if (!protectedAccountPath(request.nextUrl.pathname, request.method)) {
    const response = NextResponse.next();
    if (['/login', '/register', '/forgot-password', '/reset-password', '/auth/confirm', '/privacy'].includes(request.nextUrl.pathname) || request.nextUrl.pathname.startsWith('/api/auth/')) {
      response.headers.set('Cache-Control', 'private, no-store, max-age=0');
      response.headers.set('Referrer-Policy', 'no-referrer');
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('Content-Security-Policy', "frame-ancestors 'none'");
    }
    return response;
  }
  const context = accountContext(request, environment);
  if (!context.config.required) return NextResponse.next();
  const response = await accountProtection(request, context);
  if (response) return response;
  return context.cookies.apply(NextResponse.next({ request: { headers: context.cookies.requestHeaders(request.headers) } }));
}
export const config = { matcher: ['/:path*'] };
