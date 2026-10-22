import { BaseAccountController } from './AccountController';
import { AccountError } from './contracts';
import type { AccountCookies } from './cookies';
import type { AuthConfig, AuthEnvironment } from './config';
import { AVATAR_MAX_BYTES } from './avatarValidation';
import type { AvatarService } from './avatarService';

export class AvatarController extends BaseAccountController {
  constructor(private config: AuthConfig, private service: AvatarService, cookies: AccountCookies, private env: AuthEnvironment) { super(cookies); }
  async get() {
    try {
      const blob = await this.service.download();
      return this.cookies.apply(new Response(blob, { headers: { 'Content-Type': 'image/webp', 'Content-Disposition': 'inline; filename="avatar.webp"', 'Cross-Origin-Resource-Policy': 'same-origin', 'Content-Security-Policy': "default-src 'none'" } }));
    } catch (error) { return this.failure(error, 'avatar-download'); }
  }
  async mutate(request: Request) {
    try {
      const origin = request.headers.get('origin');
      if (!origin || origin !== new URL(request.url).origin || origin !== this.config.baseUrl) throw new AccountError('INVALID_ORIGIN', '请求来源无效，请从本站重新操作。', 403);
      const limiter = this.env.AUTH_IP_LIMITER as { limit(args: { key: string }): Promise<{ success: boolean }> } | undefined;
      if (this.config.secure && !limiter) throw new AccountError('RATE_LIMIT_NOT_READY', '账号服务正在准备中。', 503);
      if (limiter && !(await limiter.limit({ key: 'avatar:' + (request.headers.get('cf-connecting-ip') || 'local') })).success) throw new AccountError('RATE_LIMITED', '头像更换过于频繁，请稍后再试。', 429);
      if (request.method === 'DELETE') return this.success(await this.service.remove());
      if (request.headers.get('content-type') !== 'image/webp') throw new AccountError('INVALID_AVATAR', '请使用裁剪工具上传图片。', 415);
      const reader = request.body?.getReader();
      if (!reader) throw new AccountError('INVALID_AVATAR', '请选择头像图片。');
      const parts: Uint8Array[] = []; let length = 0;
      while (true) {
        const item = await reader.read(); if (item.done) break;
        length += item.value.length;
        if (length > AVATAR_MAX_BYTES) { await reader.cancel(); throw new AccountError('BODY_TOO_LARGE', '头像过大，请重新裁剪。', 413); }
        parts.push(item.value);
      }
      const bytes = new Uint8Array(length); let offset = 0;
      for (const item of parts) { bytes.set(item, offset); offset += item.length; }
      return this.success(await this.service.upload(bytes, 'image/webp'));
    } catch (error) { return this.failure(error, 'avatar-save'); }
  }
}
