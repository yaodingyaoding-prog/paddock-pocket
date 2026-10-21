import { snapshots, snapshotDate, snapshotSeason } from '../../../lib/snapshots';
const base = 'https://api.f1push.com/api/v1';
const memo = new Map<string, { expires: number; value: unknown }>();
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
  const key = paths[resource]; const cached = memo.get(key);
  if (cached && cached.expires > Date.now()) return Response.json(cached.value);
  try {
    const response = await fetch(base + key, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(9000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json() as { code: number; data: unknown };
    if (![0,200].includes(json.code) || json.data == null) throw new Error('数据暂不可用');
    const value = { data: json.data, source: 'live', updatedAt: new Date().toISOString() };
    if(memo.size > 150) memo.clear();
    memo.set(key, { expires: Date.now() + 300000, value });
    return Response.json(value, { headers: { 'Cache-Control': 'private, max-age=60' } });
  } catch {
    if (snapshots[resource] && (season === snapshotSeason || ['next','seasons'].includes(resource))) return Response.json({ data: snapshots[resource], source: 'snapshot', updatedAt: snapshotDate });
    return Response.json({ error: '暂时无法获取数据，请稍后重试' }, { status: 503 });
  }
}
