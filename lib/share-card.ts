import { weatherForecastStatus, weatherHourIndex, weatherSessionName, type WeatherSession } from './weather';

export const publicSiteUrl = 'https://f1.xiaodinglab.com';
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
type Race = { id?: string; name?: string; status?: string; circuit?: { name?: string; place?: string }; schedule?: WeatherSession[] };
type Driver = { driverId?: string; driverName?: string; teamName?: string; teamShortName?: string; teamColor?: string };
export type ShareCard = {
  kind: 'weekend' | 'podium'; title: string; subtitle: string; label: string; url: string;
  rows: { label: string; value: string; color?: string; image?: string }[];
  weather?: { summary: string; detail: string }; dataNote: string;
};
export function readSharedSelection(search: string) {
  const query = new URLSearchParams(search), season = query.get('season') || '', race = query.get('race') || '';
  const podium = (query.get('podium') || '').split(',');
  return { season: uuid.test(season) ? season : '', race: uuid.test(race) ? race : '',
    podium: podium.length <= 3 && podium.every(id => uuid.test(id)) ? [...new Set(podium)] : [] };
}
function eventDate(value: string, timezone: string) {
  const at = new Date(value);
  return Number.isFinite(+at) ? at.toLocaleString('zh-CN', { timeZone: timezone, month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }) : '时间待公布';
}
export function weekendShareCard(race: Race, season: string, timezone: string, updatedAt: string, source: string): ShareCard {
  const query = new URLSearchParams();
  const eventYear = new Date(race.schedule?.[0]?.startDate || '').getUTCFullYear();
  if (uuid.test(season)) query.set('season', season);
  if (uuid.test(race.id || '')) query.set('race', race.id!);
  return { kind: 'weekend', title: race.name || '比赛周末', subtitle: (Number.isFinite(eventYear) ? eventYear + ' 赛季 · ' : '') + (race.circuit?.name || race.circuit?.place || '赛场见'),
    label: race.status === 'Finished' ? '一起回看这场 F1' : '这个周末，一起看 F1', url: publicSiteUrl + '/?' + query + '#schedule',
    rows: [...(race.schedule || [])].sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate)).slice(0, 7).map(s => ({ label: weatherSessionName(s), value: eventDate(s.startDate, timezone) })),
    dataNote: `${timezone} · ${source === 'live' ? '赛事数据更新' : '赛事快照'} ${Number.isFinite(Date.parse(updatedAt)) ? eventDate(updatedAt, timezone) : '时间未提供'}` };
}
export function podiumShareCard(drivers: Driver[], season: string): ShareCard {
  const chosen = drivers.filter(d => uuid.test(d.driverId || '')).slice(0, 3);
  const query = new URLSearchParams({ podium: chosen.map(d => d.driverId).join(',') });
  if (uuid.test(season)) query.set('season', season);
  return { kind: 'podium', title: '我的领奖台', subtitle: '三位车手，一个主场。', label: '这是我的阵容，你呢？',
    url: publicSiteUrl + '/?' + query + '#profile',
    rows: chosen.map(d => ({ label: d.driverName || '车手', value: d.teamShortName || d.teamName || '我的选择', color: /^[a-f0-9]{6}$/i.test(d.teamColor || '') ? '#' + d.teamColor : '#84ecd7' })),
    dataNote: '车迷个人关注阵容 · 非比赛结果或预测' };
}
export function shareWeather(payload: unknown, race: Race, now = Date.now()): ShareCard['weather'] {
  const p = payload as { fetchedAt?: number; stale?: boolean; data?: { timezone?: string; hourly?: { time?: number[]; temperature_2m?: number[]; precipitation_probability?: number[] } } } | null;
  if (!p?.data || typeof p.fetchedAt !== 'number' || !Number.isFinite(p.fetchedAt) || now < p.fetchedAt || now - p.fetchedAt > 6 * 3600000) return undefined;
  const session = race.schedule?.find(s => s.type === 'MainRace'), times = p.data.hourly?.time || [];
  if (weatherForecastStatus(session, times, now) !== 'available') return undefined;
  const index = weatherHourIndex(times, Date.parse(session!.startDate) / 1000), temperature = p.data.hourly?.temperature_2m?.[index], rain = p.data.hourly?.precipitation_probability?.[index];
  if (!Number.isFinite(temperature)) return undefined;
  return { summary: `正赛预报 ${Math.round(temperature!)}°C${Number.isFinite(rain) ? ' · 降水概率 ' + Math.round(rain!) + '%' : ''}`,
    detail: `Open-Meteo · CC BY 4.0 · ${p.stale ? '缓存 / ' : ''}获取于 ${eventDate(new Date(p.fetchedAt).toISOString(), 'Asia/Shanghai')} 北京时间` };
}
