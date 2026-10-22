import { AccountError, type AccountRepository, type AccountStatus, type AuthAction } from './contracts';
import type { AuthConfig } from './config';
import { AccountCookies, RecoveryGrant } from './cookies';
import { actionSchemas, safeReturnPath } from './validation';

export class AccountService {
  constructor(private config: AuthConfig, private repository: AccountRepository | null, private cookies: AccountCookies, private recovery: RecoveryGrant) {}
  private ready(): AccountRepository {
    if (!this.config.configured || !this.repository) throw new AccountError('NOT_CONFIGURED', '账号服务正在准备中，请稍后再来。', 503);
    return this.repository;
  }
  async status(): Promise<AccountStatus> {
    if (!this.config.configured) return { enabled: this.config.required, configured: false, user: null };
    const user = await this.ready().current();
    return { enabled: this.config.required, configured: true, user: user?.verified ? { id: user.id, email: user.email, name: user.name, ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}) } : null };
  }
  async execute(action: AuthAction, input: unknown) {
    const parsed = actionSchemas[action].safeParse(input);
    if (!parsed.success) throw new AccountError('INVALID_INPUT', parsed.error.issues[0]?.message || '请检查填写的信息。');
    const repo = this.ready();
    switch (action) {
      case 'login': {
        const body = actionSchemas.login.parse(input);
        this.cookies.setRemember(body.remember);
        this.recovery.clear();
        const user = await repo.login(body.email, body.password);
        if (!user.verified) { await repo.logout(); throw new AccountError('EMAIL_UNVERIFIED', '请先验证邮箱，再登录。', 403); }
        return { user: { id: user.id, email: user.email, name: user.name, ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}) }, next: safeReturnPath(body.next) };
      }
      case 'register': {
        const body = actionSchemas.register.parse(input);
        this.cookies.setRemember(true);
        this.recovery.clear();
        try { const user = await repo.register(body.email, body.password, body.name, this.config.baseUrl + '/auth/confirm');
          if (user?.verified) return { user: { id: user.id, email: user.email, name: user.name }, next: safeReturnPath(body.next) };
        }
        catch (error) { if (!(error instanceof AccountError && error.code === 'ACCOUNT_EXISTS')) throw error; return { next:'/login', message:'请登录账号，或通过邮箱找回密码。' }; }
        return { message: '请检查邮箱，按照邮件提示完成验证；如果已注册，请直接登录或找回密码。' };
      }
      case 'resend': {
        const { email } = actionSchemas.resend.parse(input);
        await repo.resend(email, this.config.baseUrl + '/auth/confirm');
        return { message: '如果该邮箱需要验证，我们会发送新的验证邮件。' };
      }
      case 'forgot': {
        const { email } = actionSchemas.forgot.parse(input);
        await repo.recover(email, this.config.baseUrl + '/auth/confirm');
        return { message: '如果该邮箱已注册，你将收到密码重置邮件。请同时检查垃圾邮件。' };
      }
      case 'verify': {
        const body = actionSchemas.verify.parse(input);
        const user = await repo.verify(body.tokenHash, body.type);
        if (!user.verified) { await repo.logout(); throw new AccountError('EMAIL_UNVERIFIED', '邮箱验证未完成，请重新发送邮件。', 403); }
        if (body.type === 'recovery') {
          await this.recovery.issue(user.id);
          return { next: '/reset-password', message: '邮箱已确认，请设置新密码。' };
        }
        await repo.logout();
        return { next: '/login?verified=1', message: '邮箱验证成功，现在可以登录。' };
      }
      case 'reset': {
        const user = await repo.current();
        if (!user || !user.verified || !await this.recovery.permits(user.id)) throw new AccountError('RECOVERY_REQUIRED', '请从密码重置邮件中的链接重新进入。', 403);
        await repo.updatePassword(actionSchemas.reset.parse(input).password);
        this.recovery.clear();
        await repo.logout(true);
        return { next: '/login?reset=1', message: '密码已更新，请使用新密码登录。' };
      }
      case 'logout':
        this.recovery.clear();
        await repo.logout();
        return { next: '/login' };
    }
  }
}
