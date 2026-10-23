export type Following = { driverIds: string[]; teamIds: string[] };
export type FollowingStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export const activeFollowingKey = 'paddock-following-v1'; // Native widget compatibility, never the account's source of truth.
export const followingOwnerKey = 'paddock-following-owner-v2';
export const accountLogoutKey = 'paddock-account-logout';
export const followingStorageKey = (userId: string | null) => 'paddock-following-v2:' + (userId ? encodeURIComponent(userId) : 'guest');
const emptyFollowing = (): Following => ({ driverIds: [], teamIds: [] });
function stored(storage: FollowingStorage, key: string): unknown { try { return JSON.parse(storage.getItem(key) || 'null'); } catch { return null; } }
export function saveAccountFollowing(storage: FollowingStorage, userId: string | null, value: Following) {
  const clean = readFollowing(value), json = JSON.stringify(clean);
  storage.setItem(followingStorageKey(userId), json);
  storage.setItem(activeFollowingKey, json);
  storage.setItem(followingOwnerKey, userId || 'guest');
  storage.removeItem('paddock-favorite');
  return clean;
}
export function loadAccountFollowing(storage: FollowingStorage, userId: string | null): Following {
  const saved = stored(storage, followingStorageKey(userId));
  // Migrate an unclaimed legacy list only into a verified current account, never a guest.
  const mayMigrate = userId && !storage.getItem(followingOwnerKey);
  const value = saved ? readFollowing(saved) : mayMigrate ? readFollowing(stored(storage, activeFollowingKey), stored(storage, 'paddock-favorite')) : emptyFollowing();
  return saveAccountFollowing(storage, userId, value);
}
export function clearGuestFollowingAfterLogout(storage: FollowingStorage) {
  // Retain the signed-in account's own list for its next login on this device.
  storage.setItem(activeFollowingKey, JSON.stringify(emptyFollowing()));
  storage.removeItem(followingStorageKey(null));
  storage.removeItem('paddock-favorite');
  storage.removeItem('paddock-cache');
  storage.setItem(followingOwnerKey, 'guest');
  storage.setItem(accountLogoutKey, String(Date.now()));
}
const ids = (value: unknown) => Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id)))].slice(0, 100) : [];
export function readFollowing(value: unknown, legacy?: unknown): Following {
  if (value && typeof value === 'object' && 'driverIds' in value && 'teamIds' in value) return { driverIds: ids(value.driverIds).slice(0,3), teamIds: ids(value.teamIds) };
  return { driverIds: ids(typeof legacy === 'string' && legacy ? [legacy] : []), teamIds: [] };
}
export function toggleFollowing(value: Following, kind: keyof Following, id: string): Following {
  if(kind==='driverIds'&&!value.driverIds.includes(id)&&value.driverIds.length>=3)return value;
  return { ...value, [kind]: value[kind].includes(id) ? value[kind].filter(item => item !== id) : ids([...value[kind], id]) };
}
