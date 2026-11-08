type RaceTiming = {
  id?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  schedule?: {startDate?: string; endDate?: string}[];
};

// Snapshot and cached status flags age; the calendar dates still identify the weekend.
export function currentWeekend<T extends RaceTiming>(next: T | undefined, races: readonly T[], now: number): T | undefined {
  const candidates = races.map(race => race.id && race.id === next?.id ? {...race, ...next} : race);
  if (next && !candidates.some(race => race === next || race.id && race.id === next.id)) candidates.push(next);
  const dated = candidates.filter(race => !/^cancell?ed$/i.test(race.status || '')).map(race => {
    const ends = [race.endDate, ...(race.schedule || []).map(session => session.endDate || session.startDate)];
    const valid = ends.map(date => Date.parse(date || '')).filter(Number.isFinite);
    return {race, end: valid.length ? Math.max(...valid) : Date.parse(race.startDate || '')};
  }).filter(item => Number.isFinite(item.end)).sort((a, b) => a.end - b.end);
  return dated.find(item => item.end > now && item.race.status !== 'Finished')?.race
    || [...dated].reverse().find(item => item.end <= now)?.race
    || candidates.find(race => !/^cancell?ed$/i.test(race.status || ''));
}
