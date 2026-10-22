export type Following = { driverIds: string[]; teamIds: string[] };
const ids = (value: unknown) => Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(id)))].slice(0, 100) : [];
export function readFollowing(value: unknown, legacy?: unknown): Following {
  if (value && typeof value === 'object' && 'driverIds' in value && 'teamIds' in value) return { driverIds: ids(value.driverIds).slice(0,3), teamIds: ids(value.teamIds) };
  return { driverIds: ids(typeof legacy === 'string' && legacy ? [legacy] : []), teamIds: [] };
}
export function toggleFollowing(value: Following, kind: keyof Following, id: string): Following {
  if(kind==='driverIds'&&!value.driverIds.includes(id)&&value.driverIds.length>=3)return value;
  return { ...value, [kind]: value[kind].includes(id) ? value[kind].filter(item => item !== id) : ids([...value[kind], id]) };
}
