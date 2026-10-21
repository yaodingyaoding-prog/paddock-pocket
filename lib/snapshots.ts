import seasons from './snapshots/seasons_zh.json';
import next from './snapshots/next_grand_prix_zh.json';
import races from './snapshots/grands_prix_2026_zh.json';
import drivers from './snapshots/drivers_standings_2026_zh.json';
import teams from './snapshots/constructors_standings_2026_zh.json';
export const snapshotDate = '2026-10-20T09:10:45Z';
export const snapshotSeason = '3589dd46-e3ab-9929-435d-93b14f52cf6e';
export const snapshots: Record<string, unknown> = { seasons: seasons.data, next: next.data, races: races.data, drivers: drivers.data, teams: teams.data };
