import { z } from 'zod';
import { validTimezone } from './timezones';
export const themeIds = ['dark','light','navy','forest','plum','carbon','burgundy','ocean','sand','ice'] as const;
export const accentIds = ['mint','red','orange','blue','purple','gold','cyan','lime','pink','silver','coral','violet'] as const;
const ids = (max: number) => z.array(z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/)).max(max).refine(value => new Set(value).size === value.length, '选择不可重复');
export const preferencesSchema = z.object({ driverIds: ids(3), teamIds: ids(30), theme: z.enum(themeIds), accent: z.enum(accentIds), timezone: z.string().max(100).refine(validTimezone, '请选择有效时区') }).strict();
export const preferencesPatchSchema = preferencesSchema.partial().refine(value => Object.keys(value).length > 0, '请选择需要保存的设置');
export type Preferences = z.infer<typeof preferencesSchema>;
export type PreferencesPatch = Partial<Preferences>;
export type PreferencesRecord = { preferences: Preferences; revision: number; updatedAt: string };
export const defaultPreferences = (): Preferences => ({ driverIds: [], teamIds: [], theme: 'dark', accent: 'mint', timezone: 'Asia/Shanghai' });
export function preferencesFromRow(row: Record<string, unknown>): PreferencesRecord {
  return { preferences: preferencesSchema.parse({ driverIds: row.driver_ids, teamIds: row.team_ids, theme: row.theme, accent: row.accent, timezone: row.time_zone }), revision: Number(row.revision), updatedAt: String(row.updated_at) };
}
