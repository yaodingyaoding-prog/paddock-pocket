export type AccountUser = { id: string; email: string; name: string; avatarUrl?: string };
export type AccountStatus = { enabled: boolean; configured: boolean; user: AccountUser | null };
export type AccountAvailability = Pick<AccountStatus, 'enabled' | 'configured'>;
export type AuthAction = 'login' | 'register' | 'resend' | 'forgot' | 'verify' | 'reset' | 'logout';
export class AccountError extends Error {
  constructor(public code: string, message: string, public status = 400, public retryAfter?: number) { super(message); }
}
export type AccountIdentity = AccountUser & { verified: boolean };
export interface AccountRepository {
  current(): Promise<AccountIdentity | null>;
  login(email: string, password: string): Promise<AccountIdentity>;
  register(email: string, password: string, name: string, redirectTo: string): Promise<AccountIdentity | null>;
  resend(email: string, redirectTo: string): Promise<void>;
  recover(email: string, redirectTo: string): Promise<void>;
  verify(hash: string, type: 'signup' | 'recovery'): Promise<AccountIdentity>;
  updatePassword(password: string): Promise<void>;
  uploadAvatar(userId: string, bytes: Uint8Array): Promise<AccountIdentity>;
  removeAvatar(userId: string): Promise<AccountIdentity>;
  downloadAvatar(userId: string, revision?: string): Promise<Blob | null>;
  logout(all?: boolean): Promise<void>;
  clearSession(): void;
}
