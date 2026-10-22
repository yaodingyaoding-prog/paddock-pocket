export const teamAliases: Record<string, string[]> = {
  mercedes: ['mercedes','梅赛德斯','梅奔'], ferrari: ['ferrari','法拉利'], mclaren: ['mclaren','迈凯伦'], redbullracing: ['red bull racing','redbull','红牛'], racingbulls: ['racing bulls','racingbulls','rb f1','红牛二队'], astonmartin: ['aston martin','astonmartin','阿斯顿'], alpine: ['alpine','阿尔派'], haas: ['haas','哈斯'], williams: ['williams','威廉姆斯'], audi: ['audi','奥迪'], cadillac: ['cadillac','凯迪拉克'],
};
export function canonicalTeam(row: Record<string, any>) {
  const name = String(row.teamShortName || row.teamName || '').toLowerCase();
  // Match Racing Bulls before the broader Chinese Red Bull alias.
  return ['racingbulls', ...Object.keys(teamAliases).filter(key => key !== 'racingbulls')].find(key => teamAliases[key].some(alias => name.includes(alias)));
}
export type RaceLook = { title: string; kind: 'car' | 'suit'; image: string; source: string; publishedAt: string; driver?: string; verifiedDriver?: boolean };
export type RaceLookResult = { raceId: string; raceName: string; season: number; items: RaceLook[]; checkedAt: string; status: 'available' | 'unpublished' | 'unavailable'; nextCheckMinutes: number };
export function validRaceImage(value: string) {
  try {
    const url = new URL(value), path = decodeURIComponent(url.pathname);
    return url.protocol === 'https:' && url.hostname === 'media.formula1.com' && !url.port && !url.username && !url.password && !url.search && /^\/image\/upload\/[a-zA-Z0-9_.,/ -]+\.(webp|png|jpe?g)$/.test(path) && !path.includes('..');
  } catch { return false; }
}
export function raceKeywords(name: string) {
  const key = name.replace(/Grand Prix/ig,'').trim();
  const special: Record<string,string[]> = { 'United States': ['United States','US GP','Austin'], 'Great Britain': ['British Grand Prix','British GP','Silverstone'], 'Mexico City': ['Mexico','Mexican','Mexico City'], 'São Paulo': ['Sao Paulo','São Paulo','Brazil','Brazilian'], 'Abu Dhabi': ['Abu Dhabi','Yas Marina'] };
  return special[key] || [key];
}
export function announcementMatches(text: string, race: string, team: string) {
  const lower = text.toLowerCase();
  return /liver(?:y|ies)|race suits?|overalls/.test(lower) && (teamAliases[team] || []).some(alias => lower.includes(alias)) && raceKeywords(race).some(alias => alias && lower.includes(alias.toLowerCase()));
}
export function decodeEntities(value: string) { return value.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>'); }
export function rssAnnouncements(xml: string) {
  const field = (item: string, tag: string) => decodeEntities((item.match(new RegExp('<'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+tag+'>','i'))?.[1] || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').trim());
  return [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].slice(0,30).map(match => ({ title: field(match[1],'title'), description: field(match[1],'description'), url: field(match[1],'link') })).filter(item => /^https:\/\/www\.formula1\.com\/en\/latest\/article\/[^?#]+$/.test(item.url));
}
export function articleMedia(html: string) {
  const meta = new Map<string,string>();
  for (const tag of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = Object.fromEntries([...tag[0].matchAll(/([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(item => [item[1].toLowerCase(), decodeEntities(item[2])]));
    if (attrs.property || attrs.name) meta.set(attrs.property || attrs.name, attrs.content || '');
  }
  let publishedAt = meta.get('article:published_time') || '';
  if (!publishedAt) publishedAt = html.match(/"datePublished"\s*:\s*"([^"\\]+)"/)?.[1] || html.match(/\\"datePublished\\"\s*:\s*\\"([^"\\]+)\\"/)?.[1] || '';
  return { image: meta.get('og:image') || '', publishedAt };
}
