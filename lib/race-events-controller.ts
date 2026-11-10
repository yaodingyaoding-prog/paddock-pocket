import {z} from 'zod';
import {RaceEventsService,RaceEventsError} from './race-events-service';
import {OpenRaceEventsRepository,SharedRaceEventsCache} from './race-events-repository';

const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const querySchema=z.object({year:z.coerce.number().int().min(1950).max(2099),season:z.string().regex(uuid),gp:z.string().regex(uuid)});
const service=new RaceEventsService(new OpenRaceEventsRepository(),new SharedRaceEventsCache());
export async function handleRaceEventsRequest(request:Request,events:Pick<RaceEventsService,'load'>=service){
 const url=new URL(request.url),query=querySchema.safeParse(Object.fromEntries(['year','season','gp'].map(key=>[key,url.searchParams.get(key)])));
 if(!query.success)return Response.json({error:'无效的赛季或比赛编号。'},{status:400,headers:{'Cache-Control':'no-store'}});
 try{
  const data=await events.load(query.data);
  return Response.json({data},{headers:{'Cache-Control':data.stale?'no-store':'public, max-age=60, s-maxage=120'}});
 }catch(error){
  if(!(error instanceof RaceEventsError))console.warn(JSON.stringify({scope:'race-events',code:'UNEXPECTED_ERROR',reason:error instanceof Error?error.name:'unknown'}));
  const status=error instanceof RaceEventsError?error.status:503;
  return Response.json({error:error instanceof RaceEventsError?error.message:'赛会记录暂时无法读取，请稍后重试。'},{status,headers:{'Cache-Control':'no-store'}});
 }
}
