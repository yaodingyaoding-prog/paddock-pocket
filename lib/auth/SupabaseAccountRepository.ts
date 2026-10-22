import { createServerClient } from '@supabase/ssr';
import type { AuthError, User } from '@supabase/supabase-js';
import { AccountError, type AccountIdentity, type AccountRepository } from './contracts';
import type { AuthConfig } from './config';
import { AccountCookies } from './cookies';

function identity(user: User): AccountIdentity {
  const revision = String(user.user_metadata?.paddock_avatar_revision || '');
  const avatarUrl = /^[a-f0-9-]{36}$/i.test(revision) ? '/api/auth/avatar?v=' + revision : undefined;
  return { id: user.id, email: user.email || '', name: String(user.user_metadata?.name || '围场车迷').slice(0, 30), verified: Boolean(user.email_confirmed_at), ...(avatarUrl ? { avatarUrl } : {}) };
}
export function providerError(error: AuthError): never {
  if (error.code === 'over_email_send_rate_limit') throw new AccountError('PROVIDER_EMAIL_LIMITED', '验证邮件服务暂时达到发送上限，请稍后再试。这与密码输入次数无关。', 429);
  if (error.status === 429 || /rate_limit/.test(error.code || '')) throw new AccountError('PROVIDER_REQUEST_LIMITED', '账号服务暂时限制请求，请稍后重新提交。', 429);
  if (error.code === 'email_not_confirmed') throw new AccountError('EMAIL_UNVERIFIED', '请先验证邮箱，再登录。', 403);
  if (error.code === 'invalid_credentials') throw new AccountError('INVALID_CREDENTIALS', '邮箱或密码不正确。', 401);
  if (['otp_expired', 'otp_disabled'].includes(error.code || '')) throw new AccountError('LINK_EXPIRED', '验证链接已失效，请重新发送。', 400);
  if (error.code === 'same_password') throw new AccountError('SAME_PASSWORD', '请使用与原密码不同的新密码。', 400);
  if (error.code === 'weak_password') throw new AccountError('WEAK_PASSWORD', '密码强度不足，请使用更长的密码。', 400);
  if (error.code === 'user_already_exists' || error.code === 'email_exists') throw new AccountError('ACCOUNT_EXISTS', '无法完成注册，请尝试登录或找回密码。', 400);
  // Provider messages can contain email addresses or implementation details.
  throw new AccountError('AUTH_UNAVAILABLE', '账号服务暂时不可用，请稍后重试。', 503);
}

export class SupabaseAccountRepository implements AccountRepository {
  private client;
  constructor(config: AuthConfig, private cookies: AccountCookies, providerFetch: typeof fetch = fetch) {
    this.client = createServerClient(config.supabaseUrl, config.publishableKey, {
      cookieOptions: { path: '/', httpOnly: true, secure: config.secure, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 },
      cookies: {
        getAll: () => cookies.all(),
        setAll: changes => { for (const item of changes) cookies.set(item.name, item.value, item.options); },
      },
      global: { fetch: (input, init) => providerFetch(input, { ...init, signal: AbortSignal.timeout(12000) }) },
    });
  }
  async current() {
    const { data, error } = await this.client.auth.getUser();
    if (error) {
      if (['AuthSessionMissingError', 'AuthInvalidJwtError'].includes(error.name) || ['session_not_found', 'refresh_token_not_found', 'refresh_token_already_used', 'bad_jwt'].includes(error.code || '') || [401, 403].includes(error.status || 0)) return null;
      providerError(error);
    }
    return data.user ? identity(data.user) : null;
  }
  async login(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) providerError(error);
    if (!data.user || !data.user.email_confirmed_at) { this.clearSession(); throw new AccountError('EMAIL_UNVERIFIED', '请先验证邮箱，再登录。', 403); }
    return identity(data.user);
  }
  async register(email: string, password: string, name: string, redirectTo: string) {
    const { data, error } = await this.client.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: redirectTo } });
    if (error) providerError(error);
    // Auto-confirm must be disabled in the provider before public registration.
    if (data.session) { await this.logout(); throw new AccountError('VERIFICATION_REQUIRED', '邮箱验证配置尚未就绪，请稍后再试。', 503); }
  }
  async resend(email: string, redirectTo: string) {
    const { error } = await this.client.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirectTo } });
    if (error && !['user_not_found', 'email_not_confirmed'].includes(error.code || '')) providerError(error);
  }
  async recover(email: string, redirectTo: string) {
    const { error } = await this.client.auth.resetPasswordForEmail(email, { redirectTo });
    if (error && error.code !== 'user_not_found') providerError(error);
  }
  async verify(hash: string, type: 'signup' | 'recovery') {
    const { data, error } = await this.client.auth.verifyOtp({ token_hash: hash, type });
    if (error) providerError(error);
    if (!data.user) throw new AccountError('LINK_EXPIRED', '验证链接已失效，请重新发送。');
    return identity(data.user);
  }
  async updatePassword(password: string) {
    const { error } = await this.client.auth.updateUser({ password });
    if (error) providerError(error);
  }
  private avatarStorageError(error: { message: string; statusCode?: string | number }): never {
    if (String(error.statusCode) === '404' || /bucket.*not found|row.level security|policy/i.test(error.message)) throw new AccountError('AVATAR_NOT_READY', '头像存储暂未就绪，请稍后再试。', 503);
    throw new AccountError('AVATAR_UNAVAILABLE', '头像暂时无法保存，请稍后重试。', 503);
  }
  async uploadAvatar(userId: string, bytes: Uint8Array) {
    const { error } = await this.client.storage.from('paddock-avatars').upload(userId + '/avatar.webp', bytes, { upsert: true, contentType: 'image/webp', cacheControl: '0' });
    if (error) this.avatarStorageError(error);
    const { data, error: updateError } = await this.client.auth.updateUser({ data: { paddock_avatar_revision: crypto.randomUUID() } });
    if (updateError) providerError(updateError);
    return identity(data.user);
  }
  async removeAvatar(userId: string) {
    const { error } = await this.client.storage.from('paddock-avatars').remove([userId + '/avatar.webp']);
    if (error) this.avatarStorageError(error);
    const { data, error: updateError } = await this.client.auth.updateUser({ data: { paddock_avatar_revision: null } });
    if (updateError) providerError(updateError);
    return identity(data.user);
  }
  async downloadAvatar(userId: string) {
    const { data, error } = await this.client.storage.from('paddock-avatars').download(userId + '/avatar.webp');
    if (error) {
      if (['404','400'].includes(String(error.statusCode)) && /not found|does not exist|object/i.test(error.message)) return null;
      this.avatarStorageError(error);
    }
    return data;
  }
  async logout(all = false) {
    try {
      const { error } = await this.client.auth.signOut({ scope: all ? 'global' : 'local' });
      if (error && ![401, 403, 404].includes(error.status || 0)) providerError(error);
    } finally { this.clearSession(); }
  }
  clearSession() { this.cookies.clearAuth(); }
}
