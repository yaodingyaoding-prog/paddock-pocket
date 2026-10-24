import { z } from 'zod';
import { validTimezone } from './timezones';
import { themeIds, accentIds, type PreferencesRecord } from './preference-values';
export { themeIds, accentIds, defaultPreferences } from './preference-values';
export type { Preferences, PreferencesPatch, PreferencesRecord } from './preference-values';
const ids = (max: number) => z.array(z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/)).max(max).refine(value => new Set(value).size === value.length, '选择不可重复');
export const preferencesSchema = z.object({ driverIds: ids(3), teamIds: ids(30), theme: z.enum(themeIds), accent: z.enum(accentIds), timezone: z.string().max(100).refine(validTimezone, '请选择有效时区') }).strict();
export const preferencesPatchSchema = preferencesSchema.partial().refine(value => Object.keys(value).length > 0, '请选择需要保存的设置');
export function preferencesFromRow(row: Record<string, unknown>): PreferencesRecord {
  return { preferences: preferencesSchema.parse({ driverIds: row.driver_ids, teamIds: row.team_ids, theme: row.theme, accent: row.accent, timezone: row.time_zone }), revision: Number(row.revision), updatedAt: String(row.updated_at) };
}
