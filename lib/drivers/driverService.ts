import { z } from 'zod';
import type { DriverArchive, DriverRepository } from './contracts';
import { DriverDataError } from './contracts';
const team = z.object({ seasonYear: z.number().int(), name: z.string(), number: z.string().nullable().optional(), standing: z.object({ position: z.number().nullable().optional(), points: z.number().nullable().optional() }).nullable().optional() });
const profileSchema = z.object({ items: z.array(z.object({ id: z.string(), firstName: z.string().nullable().optional(), lastName: z.string().nullable().optional(), birth_date: z.string().nullable().optional(), countryName: z.string().nullable().optional(), teams: z.array(team).default([]) })).min(1) });
const statSchema = z.object({ items: z.array(z.object({ type: z.string(), value: z.number().nonnegative().nullable() })) });
export function normalizeDriver(id: string, raw: { profile: unknown; statistics: unknown }, currentYear = new Date().getUTCFullYear()): DriverArchive {
  const profile = profileSchema.parse(raw.profile).items[0];
  if (profile.id !== id) throw new DriverDataError('Mismatched driver identity');
  const statistics = statSchema.parse(raw.statistics).items;
  const value = (type: string) => statistics.find(item => item.type === type)?.value ?? null;
  const history = profile.teams.map(item => ({ year: item.seasonYear, team: item.name, number: item.number || '', position: item.standing?.position ?? null, points: item.standing?.points ?? null })).sort((a,b) => b.year - a.year);
  const completedTitles = [...new Set(history.filter(item => item.year < currentYear && item.position === 1).map(item => item.year))].sort((a,b) => a - b);
  return { id, name: [profile.firstName, profile.lastName].filter(Boolean).join('·'), birthday: profile.birth_date?.slice(0,10) || null, country: profile.countryName || '', history, career: { starts: value('Results'), wins: value('Wins'), podiums: value('Podiums'), poles: value('Poles'), titles: value('Titles') }, championshipYears: completedTitles.slice(0, value('Titles') ?? 0) };
}
const memo = new Map<string, { expires: number; value: { data: DriverArchive; updatedAt: string } }>();
export class DriverService {
  constructor(private repository: DriverRepository) {}
  async load(id: string) {
    const cached = memo.get(id);
    if (cached && cached.expires > Date.now()) return cached.value;
    const value = { data: normalizeDriver(id, await this.repository.load(id)), updatedAt: new Date().toISOString() };
    if (memo.size > 100) memo.clear();
    memo.set(id, { expires: Date.now() + 60 * 60 * 1000, value });
    return value;
  }
}
