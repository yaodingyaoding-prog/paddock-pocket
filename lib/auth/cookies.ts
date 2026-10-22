import { parseCookieHeader, serializeCookieHeader, type CookieOptions } from '@supabase/ssr';
import type { AuthConfig } from './config';

export class AccountCookies {
  private values: Map<string, string>;
  private changes = new Map<string, string>();
  remember: boolean;
  constructor(request: Request, private config: AuthConfig) {
    this.values = new Map(parseCookieHeader(request.headers.get('cookie') || '').map(item => [item.name, item.value]));
    this.remember = this.get('paddock-remember') !== '0';
  }
  get(name: string) { return this.values.get(name); }
  all() { return [...this.values].map(([name, value]) => ({ name, value })); }
  set(name: string, value: string, options: CookieOptions = {}) {
    const cookieOptions: CookieOptions = { ...options, path: '/', httpOnly: true, secure: this.config.secure, sameSite: 'lax' };
    // A non-persistent sign-in must stay non-persistent after automatic refresh.
    if (!this.remember && options.maxAge !== 0) { delete cookieOptions.maxAge; delete cookieOptions.expires; }
    this.values.set(name, value);
    this.changes.set(name, serializeCookieHeader(name, value, cookieOptions));
  }
  remove(name: string) { this.set(name, '', { maxAge: 0 }); this.values.delete(name); }
  setRemember(remember: boolean) {
    this.remember = remember;
    this.set('paddock-remember', remember ? '1' : '0', remember ? { maxAge: 60 * 60 * 24 * 30 } : {});
  }
  clearAuth() {
    for (const name of this.values.keys()) if (name.startsWith('sb-') || name.startsWith('paddock-')) this.remove(name);
  }
  apply(response: Response) {
    const result = new Response(response.body, response);
    for (const value of this.changes.values()) result.headers.append('Set-Cookie', value);
    result.headers.set('Cache-Control', 'private, no-store, max-age=0');
    result.headers.set('Pragma', 'no-cache');
    result.headers.set('Vary', 'Cookie');
    result.headers.set('Referrer-Policy', 'no-referrer');
    result.headers.set('X-Content-Type-Options', 'nosniff');
    return result;
  }
  requestHeaders(original: Headers) {
    const headers = new Headers(original);
    headers.set('cookie', this.all().map(({ name, value }) => `${name}=${encodeURIComponent(value)}`).join('; '));
    return headers;
  }
}

// This short-lived grant authorizes only the reset-password form, not sign-in.
export class RecoveryGrant {
  constructor(private cookies: AccountCookies, private secret: string, private now: () => number = Date.now) {}
  private async signature(text: string) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(this.secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
    return { key, bytes: encoder.encode(text) };
  }
  async issue(userId: string) {
    const payload = btoa(JSON.stringify({ sub: userId, exp: this.now() + 10 * 60 * 1000 }));
    const { key, bytes } = await this.signature(payload);
    const signature = btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.sign('HMAC', key, bytes))));
    this.cookies.set('paddock-recovery', payload + '.' + signature, { maxAge: 600 });
  }
  async permits(userId: string) {
    const value = this.cookies.get('paddock-recovery');
    if (!value || value.length > 1000) return false;
    try {
      const [payload, signature, extra] = value.split('.');
      if (!payload || !signature || extra) return false;
      const { key, bytes } = await this.signature(payload);
      const valid = await crypto.subtle.verify('HMAC', key, Uint8Array.from(atob(signature), c => c.charCodeAt(0)), bytes);
      if (!valid) return false;
      const grant = JSON.parse(atob(payload));
      return grant.sub === userId && Number.isFinite(grant.exp) && grant.exp > this.now() && grant.exp <= this.now() + 600001;
    } catch { return false; }
  }
  clear() { this.cookies.remove('paddock-recovery'); }
}
