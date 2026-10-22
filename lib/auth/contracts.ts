export type AccountUser = { id: string; email: string; name: string };
export type AccountStatus = { enabled: boolean; configured: boolean; user: AccountUser | null };
export type AuthAction = 'login' | 'register' | 'resend' | 'forgot' | 'verify' | 'reset' | 'logout';
export class AccountError extends Error {
  constructor(public code: string, message: string, public status = 400) { super(message); }
}
export type AccountIdentity = AccountUser & { verified: boolean };
export interface AccountRepository {
  current(): Promise<AccountIdentity | null>;
  login(email: string, password: string): Promise<AccountIdentity>;
  register(email: string, password: string, name: string, redirectTo: string): Promise<void>;
  resend(email: string, redirectTo: string): Promise<void>;
  recover(email: string, redirectTo: string): Promise<void>;
  verify(hash: string, type: 'signup' | 'recovery'): Promise<AccountIdentity>;
  updatePassword(password: string): Promise<void>;
  logout(all?: boolean): Promise<void>;
  clearSession(): void;
}
