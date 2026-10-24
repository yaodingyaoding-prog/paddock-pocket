'use client';
import { useEffect, useRef, useState } from 'react';
import type { AccountStatus, AccountUser } from '../lib/auth/contracts';
import { accountRequest } from '../lib/account-client';
import { accountLogoutKey } from '../lib/following';
import { logoutClientAccount, withoutAccountUser } from '../lib/account-ui';

export function useAccountControls(options?: { beforeLogout?: () => Promise<void> }) {
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const generation = useRef(0), signingOut = useRef(false);
  useEffect(() => {
    let live = true;
    async function refresh() {
      if (document.visibilityState === 'hidden' || signingOut.current) return;
      const version = generation.current;
      try {
        const response = await fetch('/api/auth/session', { cache: 'no-store', signal: AbortSignal.timeout(15000) });
        if (!response.ok) return;
        const value = await response.json() as AccountStatus;
        if (!live || signingOut.current || version !== generation.current) return;
        setStatus(value);
      } catch { /* Account outages must not interrupt public race browsing. */ }
    }
    void refresh();
    const timer = setInterval(() => void refresh(), 60000);
    document.addEventListener('visibilitychange', refresh);
    const signedOutElsewhere = (event: StorageEvent) => { if (event.key === accountLogoutKey) { generation.current++; setStatus(withoutAccountUser); } };
    const restored = (event: PageTransitionEvent) => { if (event.persisted) { generation.current++; setStatus(null); void refresh(); } };
    window.addEventListener('storage', signedOutElsewhere); window.addEventListener('pageshow', restored);
    return () => { live = false; clearInterval(timer); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('storage', signedOutElsewhere); window.removeEventListener('pageshow', restored); };
  }, []);
  async function logout() {
    if (signingOut.current) return;
    signingOut.current = true; generation.current++;
    setBusy(true); setError('');
    try {
      await options?.beforeLogout?.();
      await logoutClientAccount({ request: () => accountRequest('logout', {}), storage: () => localStorage,
        clearUser: () => setStatus(withoutAccountUser), notify: () => window.dispatchEvent(new Event('paddock:signed-out')),
        navigate: path => window.location.assign(path) });
    } catch (failure) { setError(failure instanceof Error ? failure.message : '暂时无法退出，请重试。'); }
    finally { signingOut.current = false; setBusy(false); }
  }
  function updateUser(user: AccountUser) { setStatus(value => value ? { ...value, user } : value); }
  return { status, error, busy, logout, updateUser };
}
