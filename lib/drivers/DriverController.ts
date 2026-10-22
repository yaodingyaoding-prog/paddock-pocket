import { z } from 'zod';
import type { DriverService } from './driverService';
export class DriverController {
  constructor(private service: DriverService) {}
  async get(id: string) {
    const parsed = z.string().uuid().safeParse(id);
    if (!parsed.success) return Response.json({ error: '无效的车手编号。' }, { status: 400 });
    try { return Response.json(await this.service.load(parsed.data), { headers: { 'Cache-Control': 'private, max-age=300' } }); }
    catch { console.error(JSON.stringify({ scope: 'driver-archive', code: 'DATA_UNAVAILABLE' })); return Response.json({ error: '生涯资料暂时无法更新，请稍后重试。' }, { status: 503 }); }
  }
}
