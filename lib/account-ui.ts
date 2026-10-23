import type { AccountStatus } from './auth/contracts';
import { clearGuestFollowingAfterLogout, type FollowingStorage } from './following';

export async function logoutClientAccount(options: {
  request: () => Promise<unknown>; storage: () => FollowingStorage;
  clearUser: () => void; notify: () => void; navigate: (path: string) => void;
}) {
  // A failed server logout is an error, not a successful local-only logout.
  await options.request();
  options.clearUser();
  try { clearGuestFollowingAfterLogout(options.storage()); } catch { /* Cookie logout still succeeds when storage is disabled. */ }
  options.notify();
  options.navigate('/login'); // A full document navigation, never a hash-only tab change.
}
export const withoutAccountUser = (status: AccountStatus | null): AccountStatus | null => status ? { ...status, user: null } : status;
