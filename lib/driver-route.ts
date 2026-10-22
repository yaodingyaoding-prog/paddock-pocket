export type DriverReturnTab = 'rankings' | 'profile' | 'schedule' | 'widgets';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const origins: DriverReturnTab[] = ['rankings', 'profile', 'schedule', 'widgets'];
export function parseDriverRoute(hash: string) {
  const [path, search = ''] = hash.replace(/^#/, '').split('?');
  const parts = path.split('/');
  if (parts.length !== 3 || parts[0] !== 'rankings' || parts[1] !== 'driver' || !uuid.test(parts[2])) return null;
  const query = new URLSearchParams(search), season = query.get('season') || '';
  const from = query.get('from') as DriverReturnTab;
  return { driverId: parts[2], driverSeason: uuid.test(season) ? season : '', driverFrom: origins.includes(from) ? from : 'rankings' as DriverReturnTab };
}
export function driverRouteHash(id: string, season: string, from: string) {
  if (!uuid.test(id) || !uuid.test(season)) throw new Error('Invalid driver or season identity');
  const query = new URLSearchParams({ season, from: origins.includes(from as DriverReturnTab) ? from : 'rankings' });
  return '#rankings/driver/' + id + '?' + query;
}
