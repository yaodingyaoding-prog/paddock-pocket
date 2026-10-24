import { validTimezone } from './timezones';
export const themeIds = ['dark','light','navy','forest','plum','carbon','burgundy','ocean','sand','ice'] as const;
export const accentIds = ['mint','red','orange','blue','purple','gold','cyan','lime','pink','silver','coral','violet'] as const;
export type Preferences = { driverIds: string[]; teamIds: string[]; theme: typeof themeIds[number]; accent: typeof accentIds[number]; timezone: string };
export type PreferencesPatch = Partial<Preferences>;
export type PreferencesRecord = { preferences: Preferences; revision: number; updatedAt: string };
export const defaultPreferences = (): Preferences => ({ driverIds: [], teamIds: [], theme: 'dark', accent: 'mint', timezone: 'Asia/Shanghai' });
// Small legacy-value sanitizer for the browser. Server writes still use the strict Zod schema.
export function cleanLegacyPreferences(value: Record<string, unknown>): Preferences {
  const ids=(v:unknown,max:number)=>Array.isArray(v)?[...new Set(v.filter((s):s is string=>typeof s==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(s)))].slice(0,max):[];
  return {driverIds:ids(value.driverIds,3),teamIds:ids(value.teamIds,30),theme:themeIds.includes(value.theme as Preferences['theme'])?value.theme as Preferences['theme']:'dark',accent:accentIds.includes(value.accent as Preferences['accent'])?value.accent as Preferences['accent']:'mint',timezone:validTimezone(value.timezone)?value.timezone:'Asia/Shanghai'};
}
