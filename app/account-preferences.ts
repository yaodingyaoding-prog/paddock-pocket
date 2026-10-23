'use client';
import { useEffect, useRef, useState } from 'react';
import type { AccountStatus } from '../lib/auth/contracts';
import { accountLogoutKey } from '../lib/following';
import { defaultPreferences, type Preferences, type PreferencesPatch, type PreferencesRecord } from '../lib/preferences';
import { PreferenceSync, type SyncView } from '../lib/preference-sync';
import { finishPreferencesMigration, legacyPreferences, mirrorWidgetFollowing } from '../lib/preferences-migration';
const initialView = (): SyncView => ({ preferences: defaultPreferences(), status: 'loading', error: '', ready: false });
export function useAccountPreferences(account: AccountStatus | null) {
  const [view, setView] = useState<SyncView>(initialView);
  const engine = useRef<PreferenceSync | null>(null), guest = useRef<Preferences>(defaultPreferences());
  const identity = useRef<string | null | undefined>(undefined), debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const userId = account?.user?.id || null;
    identity.current = account ? userId : undefined;
    let live = true, sync: PreferenceSync | null = null;
    const abort = new AbortController();
    setView(initialView());
    const run = () => { if (!document.hidden && sync) void sync.refresh().catch(() => {}); };
    const stop = () => { live = false; identity.current = undefined; sync?.dispose(); engine.current = null; if (debounce.current) clearTimeout(debounce.current); setView(initialView()); };
    const storage = (event: StorageEvent) => { if (event.key === accountLogoutKey) stop(); };
    if (account && userId) {
      let seed = defaultPreferences();
      try { seed = legacyPreferences(localStorage, userId); } catch {}
      const request = async (patch?: PreferencesPatch, initialize = false) => {
        const response = await fetch('/api/auth/preferences', { method: patch ? 'PATCH' : 'GET', credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.any([abort.signal, AbortSignal.timeout(15000)]), ...(patch ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patch, initialize }), keepalive: true } : {}) });
        const result = await response.json() as { record: PreferencesRecord | null; error?: string };
        if (!response.ok) throw new Error(result.error || '云端设置暂时无法读取，请重试。');
        return result.record;
      };
      sync = new PreferenceSync({ read: () => request(), write: async (patch, initialize) => { const record = await request(patch, initialize); if (!record) throw new Error('云端未确认保存，请重试。'); return record; } }, seed, next => {
        if (!live) return;
        setView(next);
        if (next.status === 'synced') try {
          finishPreferencesMigration(localStorage, userId);
          // The native widget consumes this snapshot; it is never read as cloud truth.
          mirrorWidgetFollowing(localStorage, userId, next.preferences);
        } catch {}
      });
      engine.current = sync;
      void sync.refresh().catch(() => {});
    } else if (account) {
      guest.current = defaultPreferences();
      setView({ preferences: guest.current, status: 'synced', error: '', ready: true });
    }
    const timer = setInterval(run, 30000);
    const beforeUnload = (event: BeforeUnloadEvent) => { if (engine.current?.hasPending()) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('online', run); window.addEventListener('focus', run); document.addEventListener('visibilitychange', run);
    window.addEventListener('paddock:signed-out', stop); window.addEventListener('storage', storage); window.addEventListener('beforeunload', beforeUnload);
    return () => { live = false; abort.abort(); sync?.dispose(); engine.current = null; if (debounce.current) clearTimeout(debounce.current); clearInterval(timer); window.removeEventListener('online', run); window.removeEventListener('focus', run); document.removeEventListener('visibilitychange', run); window.removeEventListener('paddock:signed-out', stop); window.removeEventListener('storage', storage); window.removeEventListener('beforeunload', beforeUnload); };
  }, [Boolean(account), account?.user?.id]);
  function change(patch: PreferencesPatch) {
    if (identity.current === undefined || identity.current !== (account?.user?.id || null)) return false;
    if (identity.current === null) { guest.current = { ...guest.current, ...patch }; setView({ preferences: guest.current, ready: true, status: 'synced', error: '' }); return true; }
    if (!engine.current?.change(patch)) return false;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => void engine.current?.flush().catch(() => {}), 650);
    return true;
  }
  async function flush() { if (debounce.current) clearTimeout(debounce.current); await engine.current?.flush(); }
  async function retry() { await engine.current?.refresh(); }
  const visible = identity.current === (account ? account.user?.id || null : undefined) ? view : initialView();
  return { ...visible, change, flush, retry, signedIn: Boolean(account?.user) };
}
