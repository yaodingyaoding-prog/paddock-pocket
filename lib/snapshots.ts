import seasons from './snapshots/seasons_zh.json';
import next from './snapshots/next_grand_prix_zh.json';
import races from './snapshots/grands_prix_2026_zh.json';
import drivers from './snapshots/drivers_standings_2026_zh.json';
import teams from './snapshots/constructors_standings_2026_zh.json';
export { snapshotDate, snapshotSeason } from './snapshot-meta';
export const snapshots: Record<string, unknown> = { seasons: seasons.data, next: next.data, races: races.data, drivers: drivers.data, teams: teams.data };
