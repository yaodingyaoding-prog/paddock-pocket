import { z } from 'zod';
import { AccountError, type AuthAction } from './contracts';
import { AccountService } from './accountService';
import type { AuthConfig, AuthEnvironment } from './config';
import { AccountCookies } from './cookies';

const actionSchema = z.enum(['login', 'register', 'resend', 'forgot', 'verify', 'reset', 'logout']);
const emailActions = new Set(['register', 'resend', 'forgot']);
type Limiter = { limit(options: { key: string }): Promise<{ success: boolean }> };

export class BaseAccountController {
  constructor(protected cookies: AccountCookies) {}
  protected success(value: unknown, status = 200) {
    return this.cookies.apply(Response.json(value, { status }));
  }
  protected failure(error: unknown, operation: string) {
    const failure = error instanceof AccountError ? error : new AccountError('AUTH_UNAVAILABLE', '账号服务暂时不可用，请稍后重试。', 503);
    if (failure.status >= 500) console.error(JSON.stringify({ scope: 'account', operation, code: failure.code, status: failure.status }));
    const response = this.success({ error: failure.message, code: failure.code }, failure.status);
    if (failure.status === 429) response.headers.set('Retry-After', '60');
    return response;
  }
}

async function readBody(request: Request) {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new AccountError('CONTENT_TYPE', '请使用有效的表单请求。', 415);
  const reader = request.body?.getReader();
  if (!reader) throw new AccountError('INVALID_INPUT', '请填写表单。');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.byteLength;
    if (size > 8192) { await reader.cancel(); throw new AccountError('BODY_TOO_LARGE', '表单内容过长。', 413); }
    chunks.push(part.value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)) as unknown; }
  catch { throw new AccountError('INVALID_INPUT', '表单格式不正确。'); }
}

export class AccountController extends BaseAccountController {
  constructor(private config: AuthConfig, private service: AccountService, cookies: AccountCookies, private env: AuthEnvironment) { super(cookies); }
  async session() {
    try { return this.success(await this.service.status()); }
    catch (error) { return this.failure(error, 'session'); }
  }
  async post(request: Request, actionValue: string) {
    try {
      const parsed = actionSchema.safeParse(actionValue);
      if (!parsed.success) throw new AccountError('NOT_FOUND', '没有这个账号操作。', 404);
      const origin = request.headers.get('origin');
      if (!origin || origin !== new URL(request.url).origin || origin !== this.config.baseUrl) throw new AccountError('INVALID_ORIGIN', '请求来源无效，请从本站重新操作。', 403);
      const body = await readBody(request);
      await this.rateLimit(request, parsed.data, body);
      return this.success(await this.service.execute(parsed.data, body));
    } catch (error) { return this.failure(error, actionValue); }
  }
  private async rateLimit(request: Request, action: AuthAction, body: unknown) {
    const local = !this.config.secure;
    const ipLimiter = this.env.AUTH_IP_LIMITER as Limiter | undefined;
    const emailLimiter = this.env.AUTH_EMAIL_LIMITER as Limiter | undefined;
    if (!local && (!ipLimiter || !emailLimiter)) throw new AccountError('RATE_LIMIT_NOT_READY', '账号服务正在准备中，请稍后再试。', 503);
    const ip = request.headers.get('cf-connecting-ip') || 'local';
    if (ipLimiter && !(await ipLimiter.limit({ key: 'account:' + ip })).success) throw new AccountError('RATE_LIMITED', '操作过于频繁，请稍后再试。', 429);
    const email = typeof body === 'object' && body !== null && 'email' in body ? String(body.email).trim().toLowerCase().slice(0, 254) : '';
    if (emailLimiter && email && emailActions.has(action)) {
      const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email));
      const key = 'mail:' + [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
      if (!(await emailLimiter.limit({ key })).success) throw new AccountError('RATE_LIMITED', '邮件刚刚发送过，请 60 秒后再试。', 429);
    }
  }
}
