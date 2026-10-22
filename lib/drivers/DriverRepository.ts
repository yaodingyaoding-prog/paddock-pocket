import type { DriverRepository } from './contracts';
import { DriverDataError } from './contracts';
export class PublicDriverRepository implements DriverRepository {
  constructor(private providerFetch: typeof fetch = fetch) {}
  async load(id: string) {
    const [profile, statistics] = await Promise.all(['profile','statistics'].map(async resource => {
      const response = await this.providerFetch(`https://api.f1push.com/api/v1/drivers/${id}/${resource}?lang=zh`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new DriverDataError('Driver data unavailable');
      const json = await response.json() as { code?: number; data?: unknown };
      if (![0,200].includes(json.code || 0) || !json.data) throw new DriverDataError('Driver data unavailable');
      return json.data;
    }));
    return { profile, statistics };
  }
}
