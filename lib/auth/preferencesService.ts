import { AccountError } from './contracts';
import type { AccountRepository } from './contracts';
import { preferencesPatchSchema, type PreferencesPatch, type PreferencesRecord } from '../preferences';
export interface PreferencesRepository {
  readPreferences(userId: string): Promise<PreferencesRecord | null>;
  writePreferences(patch: PreferencesPatch, initialize: boolean): Promise<PreferencesRecord>;
}
export class PreferencesService {
  constructor(private repository: (Pick<AccountRepository, 'current'> & PreferencesRepository) | null) {}
  private async owner() {
    if (!this.repository) throw new AccountError('NOT_CONFIGURED', '账号服务正在准备中。', 503);
    const user = await this.repository.current();
    if (!user?.verified) throw new AccountError('AUTH_REQUIRED', '请先登录后同步设置。', 401);
    return { repo: this.repository, user };
  }
  async read() { const { repo, user } = await this.owner(); return { record: await repo.readPreferences(user.id) }; }
  async save(value: unknown, initialize: boolean) {
    const { repo } = await this.owner();
    const parsed = preferencesPatchSchema.safeParse(value);
    if (!parsed.success) throw new AccountError('INVALID_INPUT', parsed.error.issues[0]?.message || '设置内容无效。');
    return { record: await repo.writePreferences(parsed.data, initialize) };
  }
}
