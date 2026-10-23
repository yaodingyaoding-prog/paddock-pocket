'use client';
import { useEffect, useState } from 'react';
import type { AccountStatus, AccountUser } from '../lib/auth/contracts';
import { accountRequest } from './auth-screen';

export function useAccountControls() {
  const [status, setStatus] = useState<AccountStatus | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let live = true;
    async function refresh() {
      if (document.visibilityState === 'hidden') return;
      try {
        const response = await fetch('/api/auth/session', { cache: 'no-store', signal: AbortSignal.timeout(15000) });
        if (!response.ok) return;
        const value = await response.json() as AccountStatus;
        if (!live) return;
        setStatus(value);
      } catch { /* Account outages must not interrupt public race browsing. */ }
    }
    void refresh();
    const timer = setInterval(() => void refresh(), 60000);
    document.addEventListener('visibilitychange', refresh);
    return () => { live = false; clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  async function logout() {
    setBusy(true); setError('');
    try {
      await accountRequest('logout', {});
      try { localStorage.removeItem('paddock-cache'); } catch { /* Storage may be disabled. */ }
      window.location.assign('/#schedule');
    } catch (failure) { setError(failure instanceof Error ? failure.message : '暂时无法退出，请重试。'); }
    finally { setBusy(false); }
  }
  function updateUser(user: AccountUser) { setStatus(value => value ? { ...value, user } : value); }
  return { status, error, busy, logout, updateUser };
}
