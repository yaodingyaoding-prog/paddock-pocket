import { z } from 'zod';
import { BaseAccountController, readAccountBody } from './AccountController';
import { AccountError } from './contracts';
import type { AuthConfig, AuthEnvironment } from './config';
import type { AccountCookies } from './cookies';
import type { PreferencesService } from './preferencesService';
const bodySchema = z.object({ patch: z.unknown(), initialize: z.boolean().optional() }).strict();
export class PreferencesController extends BaseAccountController {
  constructor(private config: AuthConfig, private service: PreferencesService, cookies: AccountCookies, private env: AuthEnvironment) { super(cookies); }
  async get() { try { return this.success(await this.service.read()); } catch (error) { return this.failure(error, 'preferences-read'); } }
  async patch(request: Request) {
    try {
      const origin = request.headers.get('origin');
      if (!origin || origin !== new URL(request.url).origin || origin !== this.config.baseUrl) throw new AccountError('INVALID_ORIGIN', '请求来源无效，请从本站重新操作。', 403);
      const body = bodySchema.safeParse(await readAccountBody(request));
      if (!body.success) throw new AccountError('INVALID_INPUT', '设置内容无效。');
      const limiter = this.env.AUTH_IP_LIMITER as { limit(args: { key: string }): Promise<{ success: boolean }> } | undefined;
      if (this.config.secure && !limiter) throw new AccountError('RATE_LIMIT_NOT_READY', '账号服务正在准备中。', 503);
      if (limiter && !(await limiter.limit({ key: 'preferences:' + (request.headers.get('cf-connecting-ip') || 'local') })).success) throw new AccountError('RATE_LIMITED', '设置保存较频繁，请稍后重试。', 429, 60);
      return this.success(await this.service.save(body.data.patch, Boolean(body.data.initialize)));
    } catch (error) { return this.failure(error, 'preferences-save'); }
  }
}
