import { z } from 'zod';
import { teamAliases, validRaceImage } from './race-media';
import type { RaceMediaService } from './race-media-service';
const schema = z.object({ race: z.string().uuid(), season: z.coerce.number().int().min(1950).max(2100), team: z.string().refine(value => Object.hasOwn(teamAliases,value)), driver: z.string().regex(/^[A-Z]{3}$/).or(z.literal('')).default('') });
export class RaceMediaController {
  constructor(private service: RaceMediaService) {}
  async get(request: Request) {
    const query = new URL(request.url).searchParams;
    try {
      if (query.has('image')) {
        const image = query.get('image') || '';
        if (!validRaceImage(image)) return Response.json({ error: '无效的图片地址。' },{status:400});
        const file = await this.service.image(image);
        return new Response(file.bytes, { headers: { 'Content-Type': file.type, 'Cache-Control': 'private, max-age=3600', 'X-Content-Type-Options':'nosniff', 'Cross-Origin-Resource-Policy':'same-origin' } });
      }
      const parsed = schema.safeParse(Object.fromEntries(query));
      if (!parsed.success) return Response.json({error:'无效的赛事图片请求。'},{status:400});
      const {race,season,team,driver} = parsed.data;
      return Response.json(await this.service.load(race,season,team,driver),{headers:{'Cache-Control':'private, max-age=300'}});
    } catch (error) { const reason = error instanceof Error && /^(INVALID_MEDIA|MEDIA_UNAVAILABLE|MEDIA_TOO_LARGE|EMPTY_MEDIA)$/.test(error.message) ? error.message : 'FETCH_FAILED'; console.error(JSON.stringify({scope:'race-media',code:'MEDIA_UNAVAILABLE',reason})); return Response.json({error:'本站图片暂时无法更新。'},{status:503}); }
  }
}
