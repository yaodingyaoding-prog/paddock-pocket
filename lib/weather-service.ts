import { z } from 'zod';
import extras from './circuit-extra.json';
import { circuitLocations } from './circuit-locations';
import { weatherUrl } from './weather';

const points = new Set([...Object.values(extras).map(c => [c.latitude, c.longitude].join(',')), ...Object.values(circuitLocations).map(c => c.join(','))]);
const series = z.array(z.number().nullable()).min(1).max(500);
const forecastSchema = z.object({ timezone: z.string().max(100), current: z.object({ time: z.number(), temperature_2m: z.number().nullable() }).passthrough(), hourly: z.object({ time: z.array(z.number()).min(1).max(500), temperature_2m: series, apparent_temperature: series, relative_humidity_2m: series, wind_speed_10m: series, precipitation_probability: series, weather_code: series }).passthrough() }).passthrough();
type Forecast = z.infer<typeof forecastSchema>;
export type WeatherEntry = { data: Forecast; fetchedAt: number };
export interface WeatherCache { get(key: string): Promise<WeatherEntry | undefined>; put(key: string, value: WeatherEntry): Promise<void> }
export class WeatherError extends Error { constructor(public code: string, public status = 503) { super(code); } }
export class OpenMeteoRepository {
  constructor(private request: typeof fetch = fetch) {}
  async get(location: string): Promise<Forecast> {
    let response: Response;
    try { response = await this.request(weatherUrl(location), { signal: AbortSignal.timeout(10000), headers: { Accept: 'application/json' } }); }
    catch (error) { throw new WeatherError(error instanceof Error && ['TimeoutError','AbortError'].includes(error.name) ? 'WEATHER_TIMEOUT' : 'WEATHER_NETWORK'); }
    if (!response.ok) throw new WeatherError(response.status === 429 ? 'WEATHER_UPSTREAM_LIMITED' : 'WEATHER_UPSTREAM_UNAVAILABLE');
    let parsed;
    try { parsed = forecastSchema.safeParse(await response.json()); } catch { throw new WeatherError('WEATHER_FORMAT'); }
    if (!parsed.success || Object.values(parsed.data.hourly).some(v => Array.isArray(v) && v.length !== parsed.data.hourly.time.length)) throw new WeatherError('WEATHER_FORMAT');
    return parsed.data;
  }
}
const freshMs = 5 * 60000, staleMs = 6 * 3600000;
export class WeatherService {
  private pending = new Map<string, Promise<WeatherEntry & { stale: boolean }>>();
  private failures = new Map<string, number>();
  constructor(private repository: Pick<OpenMeteoRepository, 'get'>, private cache: WeatherCache, private now = Date.now) {}
  async get(location: string) {
    if (!points.has(location)) throw new WeatherError('WEATHER_LOCATION', 400);
    const pending = this.pending.get(location); if (pending) return pending;
    const task = this.load(location); this.pending.set(location, task);
    try { return await task; } finally { this.pending.delete(location); }
  }
  private async load(location: string) {
    const at = this.now();
    const saved = await this.cache.get(location).catch(() => undefined);
    if (saved && at - saved.fetchedAt >= 0 && at - saved.fetchedAt < freshMs) return { ...saved, stale: false };
    if ((this.failures.get(location) || 0) > at) {
      if (saved && at - saved.fetchedAt < staleMs) return { ...saved, stale: true };
      throw new WeatherError('WEATHER_RETRY_LATER');
    }
    try {
      const entry = { data: await this.repository.get(location), fetchedAt: this.now() };
      await this.cache.put(location, entry).catch(() => {}); this.failures.delete(location);
      return { ...entry, stale: false };
    } catch (error) {
      if (this.failures.size > 96) this.failures.clear();
      this.failures.set(location, at + 60000);
      console.warn(JSON.stringify({ scope: 'weather', code: error instanceof WeatherError ? error.code : 'WEATHER_UNAVAILABLE' }));
      if (saved && at - saved.fetchedAt >= 0 && at - saved.fetchedAt < staleMs) return { ...saved, stale: true };
      throw error;
    }
  }
}

// Public meteorological data only. No account cookies or personal information enter this cache.
export class SharedWeatherCache implements WeatherCache {
  private memory = new Map<string, WeatherEntry>();
  private edge() { return typeof caches === 'undefined' ? undefined : (caches as CacheStorage & { default?: Cache }).default; }
  private key(location: string) { return 'https://weather-cache.invalid/v1/' + encodeURIComponent(location); }
  async get(location: string) {
    const local = this.memory.get(location); if (local) return local;
    const response = await this.edge()?.match(this.key(location));
    if (!response) return undefined;
    const candidate = await response.json() as WeatherEntry;
    const parsed = forecastSchema.safeParse(candidate?.data);
    if (!parsed.success || !Number.isFinite(candidate.fetchedAt)) return undefined;
    return { data: parsed.data, fetchedAt: candidate.fetchedAt };
  }
  async put(location: string, value: WeatherEntry) {
    if (this.memory.size >= 96) this.memory.clear(); this.memory.set(location, value);
    await this.edge()?.put(this.key(location), Response.json(value, { headers: { 'Cache-Control': 'public, max-age=21600' } }));
  }
}
export class WeatherController {
  constructor(private service: WeatherService) {}
  async get(request: Request) {
    try { return Response.json(await this.service.get(new URL(request.url).searchParams.get('location') || ''), { headers: { 'Cache-Control': 'private, no-store' } }); }
    catch (error) { const failure = error instanceof WeatherError ? error : new WeatherError('WEATHER_UNAVAILABLE'); return Response.json({ code: failure.code, error: failure.status === 400 ? '赛道位置无效。' : '暂时无法连接天气服务，请稍后重试。' }, { status: failure.status, headers: { 'Cache-Control': 'no-store', 'Retry-After': '60' } }); }
  }
}
