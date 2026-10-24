import { snapshots, snapshotDate, snapshotSeason } from '../../../lib/snapshots';
import {RaceDataService,SharedRaceCache} from '../../../lib/race-data-service';
const service=new RaceDataService(new SharedRaceCache());
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const resource = query.get('resource') || 'next';
  const season = query.get('season') || snapshotSeason;
  const session = query.get('session') || '';
  const gp = query.get('gp') || '';
  const kind = query.get('kind') || 'races';
  if (!uuid.test(season) || (session && !uuid.test(session)) || (gp && !uuid.test(gp))) return Response.json({ error: '无效的赛事编号' }, { status: 400 });
  const paths: Record<string, string> = {
    seasons: '/seasons?page=1&pageSize=100&lang=zh', next: '/nextgrands-prix?lang=zh',
    races: `/grands-prix?season_id=${season}&page=1&pageSize=100&lang=zh`,
    drivers: `/seasons/${season}/drivers-standings?page=1&pageSize=100&isLastStanding=true&lang=zh`,
    teams: `/seasons/${season}/constructors-standings?page=1&pageSize=100&isLastStanding=true&lang=zh`,
    results: `/grands-prix/${gp}/${kind}/${session}/results?lang=zh`,
  };
  if (!paths[resource] || (resource === 'results' && (!session || !gp || !['races','qualifying','practices'].includes(kind)))) return Response.json({ error: '暂不支持这类数据' }, { status: 400 });
  const fallback=snapshots[resource] && (season===snapshotSeason || ['next','seasons'].includes(resource)) ? {data:snapshots[resource],source:'snapshot' as const,updatedAt:snapshotDate} : undefined;
  try {
    const value=await service.get(paths[resource],fallback);
    return Response.json(value, { headers: { 'Cache-Control': value.source==='live'?'public, max-age=30, s-maxage=60':'public, max-age=15, s-maxage=15','X-Paddock-Data-Source':value.source } });
  } catch {
    return Response.json({ error: '暂时无法获取数据，请稍后重试' }, { status: 503,headers:{'Cache-Control':'no-store','Retry-After':'45'} });
  }
}
