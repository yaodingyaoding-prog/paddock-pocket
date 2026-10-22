import { announcementMatches, articleMedia, rssAnnouncements, validRaceImage, type RaceLookResult, type RaceLook } from './race-media';
import { raceMediaSeeds } from './race-media-seeds';

export async function boundedMediaFetch(url: string, maxBytes: number, providerFetch: typeof fetch = fetch) {
  // Workers supports manual/follow, not the browser's redirect:error mode.
  // Reject 3xx responses instead of allowing a redirect beyond the allowlist.
  const response = await providerFetch(url, { redirect: 'manual', signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('MEDIA_UNAVAILABLE');
  const reader = response.body?.getReader(); if (!reader) throw new Error('EMPTY_MEDIA');
  const parts: Uint8Array[] = []; let size = 0;
  while (true) { const item = await reader.read(); if (item.done) break; size += item.value.length; if (size > maxBytes) { await reader.cancel(); throw new Error('MEDIA_TOO_LARGE'); } parts.push(item.value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const part of parts) { bytes.set(part,offset); offset += part.length; }
  return { bytes, type: response.headers.get('content-type') || '' };
}
type Context = { id: string; name: string; nameKey: string; startDate: string; endDate: string; season: { year: number } };
export class RaceMediaRepository {
  constructor(private providerFetch: typeof fetch = fetch) {}
  async nextRace(): Promise<Context> {
    const response = await this.providerFetch('https://api.f1push.com/api/v1/nextgrands-prix?lang=zh', { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error('CONTEXT_UNAVAILABLE');
    return (await response.json() as { data: Context }).data;
  }
  async announcements() { return rssAnnouncements(new TextDecoder().decode((await boundedMediaFetch('https://www.formula1.com/en/latest/all.xml',200000,this.providerFetch)).bytes)); }
  async article(url: string) { return articleMedia(new TextDecoder().decode((await boundedMediaFetch(url,2000000,this.providerFetch)).bytes)); }
  async image(url: string) { return boundedMediaFetch(url,3000000,this.providerFetch); }
}
const memo = new Map<string, { expires: number; result: RaceLookResult }>();
export class RaceMediaService {
  constructor(private repository: RaceMediaRepository) {}
  async load(raceId: string, season: number, team: string, driver: string) {
    const key = [raceId,season,team].join(':');
    const cached = memo.get(key);
    let result: RaceLookResult;
    if (cached && cached.expires > Date.now()) result = cached.result;
    else {
      const seeded = raceMediaSeeds.filter(item => item.raceId === raceId && item.season === season && item.team === team).map(item => item.item);
      result = { raceId, raceName: '', season, items: [...seeded], checkedAt: new Date().toISOString(), status: seeded.length ? 'available' : 'unpublished', nextCheckMinutes: 60 };
      try {
        const next = await this.repository.nextRace();
        if (next.id !== raceId || next.season.year !== season) return { ...result, status: 'unavailable' as const, items: [] };
        result.raceName = next.name;
        const start = Date.parse(next.startDate), end = Date.parse(next.endDate), now = Date.now();
        result.nextCheckMinutes = now >= start - 7 * 86400000 && now <= end + 86400000 ? 60 : 360;
        const candidates = (await this.repository.announcements()).filter(item => announcementMatches(item.title + ' ' + item.description, next.nameKey, team)).slice(0,3);
        const fetched = await Promise.allSettled(candidates.map(async item => {
          const media = await this.repository.article(item.url), date = Date.parse(media.publishedAt);
          if (!validRaceImage(media.image) || !Number.isFinite(date) || date < start - 14 * 86400000 || date > end + 86400000) return null;
          return { title: /race suits?|overalls/i.test(item.title) && !/liver/i.test(item.title) ? '本站赛车服 · 官方发布图' : '本站车队特别涂装 · 官方发布图', kind: /race suits?|overalls/i.test(item.title) && !/liver/i.test(item.title) ? 'suit' : 'car', image: media.image, source: item.url, publishedAt: media.publishedAt } satisfies RaceLook;
        }));
        for (const entry of fetched) if (entry.status === 'fulfilled' && entry.value && !result.items.some(item => item.image === entry.value!.image)) result.items.push(entry.value);
        result.status = result.items.length ? 'available' : 'unpublished';
      } catch { if (!seeded.length) result.status = 'unavailable'; }
      if (memo.size > 40) memo.clear();
      memo.set(key, { expires: Date.now() + (result.status === 'unavailable' ? 5 : result.nextCheckMinutes) * 60000, result });
    }
    return { ...result, items: result.items.filter(item => !item.driver || !driver || item.driver === driver).sort((a,b) => Number(Boolean(b.driver && b.driver === driver)) - Number(Boolean(a.driver && a.driver === driver))) };
  }
  async image(url: string) {
    if (!validRaceImage(url)) throw new Error('INVALID_MEDIA');
    const file = await this.repository.image(url);
    if (!/^image\/(webp|png|jpe?g)(;|$)/i.test(file.type)) throw new Error('INVALID_MEDIA');
    return file;
  }
}
