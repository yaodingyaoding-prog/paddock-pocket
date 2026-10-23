import { activeFollowingKey, followingOwnerKey, followingStorageKey, readFollowing, type FollowingStorage } from './following';
import { defaultPreferences, preferencesSchema, type Preferences } from './preferences';
function parsed(storage: FollowingStorage, key: string): unknown { try { return JSON.parse(storage.getItem(key) || 'null'); } catch { return null; } }
export function legacyPreferences(storage: FollowingStorage, userId: string): Preferences {
  const fallback = defaultPreferences();
  const owner = storage.getItem(followingOwnerKey);
  const saved = parsed(storage, followingStorageKey(userId));
  const following = saved ? readFollowing(saved) : !owner || owner === userId ? readFollowing(parsed(storage, activeFollowingKey), parsed(storage, 'paddock-favorite')) : { driverIds: [], teamIds: [] };
  const candidate = { ...fallback, ...following, theme: parsed(storage, 'paddock-theme') ?? fallback.theme, accent: parsed(storage, 'paddock-accent') ?? fallback.accent, timezone: parsed(storage, 'paddock-timezone') ?? fallback.timezone };
  // Validate each legacy field independently so one obsolete setting cannot lose the rest.
  for (const key of ['theme','accent','timezone','driverIds','teamIds'] as const) {
    const result = preferencesSchema.shape[key].safeParse(candidate[key]);
    if (!result.success) Object.assign(candidate, { [key]: fallback[key] });
  }
  return preferencesSchema.parse(candidate);
}
export function finishPreferencesMigration(storage: FollowingStorage, userId: string) {
  storage.removeItem(followingStorageKey(userId));
  for (const key of ['paddock-theme','paddock-accent','paddock-timezone','paddock-favorite']) storage.removeItem(key);
}
export function mirrorWidgetFollowing(storage: FollowingStorage, userId: string, value: Preferences) {
  storage.setItem(activeFollowingKey, JSON.stringify({ driverIds: value.driverIds, teamIds: value.teamIds }));
  storage.setItem(followingOwnerKey, userId);
}
