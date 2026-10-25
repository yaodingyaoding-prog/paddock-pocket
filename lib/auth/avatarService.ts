import { AccountError, type AccountIdentity, type AccountRepository } from './contracts';
import { validateAvatar } from './avatarValidation';

const summary = (user: AccountIdentity) => ({ id: user.id, email: user.email, name: user.name, ...(user.avatarUrl ? { avatarUrl: user.avatarUrl } : {}) });
export class AvatarService {
  constructor(private repository: AccountRepository | null) {}
  private async owner() {
    if (!this.repository) throw new AccountError('NOT_CONFIGURED', '账号服务正在准备中，请稍后再试。', 503);
    const user = await this.repository.current();
    if (!user?.verified) throw new AccountError('AUTH_REQUIRED', '请先登录并验证邮箱。', 401);
    return { repo: this.repository, user };
  }
  async upload(bytes: Uint8Array, mime: string) {
    const { repo, user } = await this.owner();
    validateAvatar(bytes, mime);
    return { user: summary(await repo.uploadAvatar(user.id, bytes)) };
  }
  async remove() {
    const { repo, user } = await this.owner();
    return { user: summary(await repo.removeAvatar(user.id)) };
  }
  async download() {
    const { repo, user } = await this.owner();
    const revision = user.avatarUrl ? new URL(user.avatarUrl, 'https://avatar.invalid').searchParams.get('v') || undefined : undefined;
    const blob = await repo.downloadAvatar(user.id, revision);
    if (!blob) throw new AccountError('AVATAR_MISSING', '尚未设置头像。', 404);
    return blob;
  }
}
