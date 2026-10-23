import { unifiedAuthConfig, type AuthEnvironment } from './config';
import { AccountCookies, RecoveryGrant } from './cookies';
import { SupabaseAccountRepository } from './SupabaseAccountRepository';
import { AccountService } from './accountService';
import { AccountController } from './AccountController';
import { AvatarService } from './avatarService';
import { AvatarController } from './AvatarController';
import { PreferencesService } from './preferencesService';
import { PreferencesController } from './PreferencesController';

export function accountContext(request: Request, env: AuthEnvironment) {
  const config = unifiedAuthConfig(env);
  const cookies = new AccountCookies(request, config);
  const recovery = new RecoveryGrant(cookies, config.sessionSecret);
  const repository = config.configured ? new SupabaseAccountRepository(config, cookies) : null;
  const service = new AccountService(config, repository, cookies, recovery);
  return { config, cookies, service, controller: new AccountController(config, service, cookies, env), avatarController: new AvatarController(config, new AvatarService(repository), cookies, env), preferencesController: new PreferencesController(config, new PreferencesService(repository), cookies, env) };
}
