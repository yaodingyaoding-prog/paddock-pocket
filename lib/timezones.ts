export const timezoneNames: Record<string, string> = {
  UTC: '协调世界时', 'Asia/Shanghai': '北京时间', 'Asia/Hong_Kong': '香港', 'Asia/Taipei': '台北', 'Asia/Tokyo': '东京', 'Asia/Seoul': '首尔', 'Asia/Singapore': '新加坡', 'Asia/Kuala_Lumpur': '吉隆坡', 'Asia/Bangkok': '曼谷', 'Asia/Kolkata': '新德里', 'Asia/Dubai': '迪拜', 'Asia/Qatar': '多哈', 'Asia/Bahrain': '巴林', 'Asia/Riyadh': '利雅得', 'Asia/Baku': '巴库', 'Europe/London': '伦敦', 'Europe/Paris': '巴黎', 'Europe/Monaco': '摩纳哥', 'Europe/Rome': '罗马', 'Europe/Madrid': '马德里', 'Europe/Berlin': '柏林', 'Europe/Amsterdam': '阿姆斯特丹', 'Europe/Brussels': '布鲁塞尔', 'Europe/Vienna': '维也纳', 'Europe/Budapest': '布达佩斯', 'Europe/Helsinki': '赫尔辛基', 'Europe/Moscow': '莫斯科', 'America/New_York': '纽约', 'America/Chicago': '奥斯汀 / 芝加哥', 'America/Los_Angeles': '洛杉矶 / 拉斯维加斯', 'America/Denver': '丹佛', 'America/Phoenix': '凤凰城', 'America/Toronto': '多伦多', 'America/Montreal': '蒙特利尔', 'America/Mexico_City': '墨西哥城', 'America/Sao_Paulo': '圣保罗', 'America/Argentina/Buenos_Aires': '布宜诺斯艾利斯', 'Australia/Melbourne': '墨尔本', 'Australia/Sydney': '悉尼', 'Australia/Perth': '珀斯', 'Australia/Adelaide': '阿德莱德', 'Pacific/Auckland': '奥克兰', 'Pacific/Honolulu': '檀香山', 'Africa/Johannesburg': '约翰内斯堡', 'Africa/Cairo': '开罗',
};
export function validTimezone(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 80) return false;
  try { new Intl.DateTimeFormat('en', { timeZone: value }).format(0); return true; } catch { return false; }
}
export function availableTimezones(local = 'Asia/Shanghai') {
  let all: string[] = [];
  try { all = Intl.supportedValuesOf('timeZone'); } catch { /* The curated set supports older browsers. */ }
  return [...new Set(['Asia/Shanghai', local, 'UTC', ...Object.keys(timezoneNames), ...all])].filter(validTimezone);
}
export function timezoneOffset(zone: string, date = new Date()) {
  try { return new Intl.DateTimeFormat('en', { timeZone: zone, timeZoneName: 'shortOffset' }).formatToParts(date).find(part => part.type === 'timeZoneName')?.value.replace('GMT', 'UTC') || 'UTC'; } catch { return zone; }
}
export const timezoneLabel = (zone: string) => timezoneNames[zone] || zone.split('/').slice(1).join(' / ').replace(/_/g, ' ') || zone;
