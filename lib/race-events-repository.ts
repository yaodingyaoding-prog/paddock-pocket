import {z} from 'zod';
import {RaceDataService,SharedRaceCache} from './race-data-service';
import {RaceEventsError,type RaceEventsRepository,type RaceEventsCache,type RaceEventsResult} from './race-events-service';
import type {EventRace,ControlSession,ControlDriver,ControlMessage} from './race-events';

const date=z.string().max(80).refine(value=>Number.isFinite(Date.parse(value)));
const sessionSchema=z.object({session_key:z.number().int().positive(),meeting_key:z.number().int().positive(),year:z.number().int(),session_name:z.string().max(80),date_start:date,date_end:date,is_cancelled:z.boolean().optional()});
const driverSchema=z.object({driver_number:z.number().int().positive(),name_acronym:z.string().max(8),full_name:z.string().max(100)});
const messageSchema=z.object({session_key:z.number().int().positive(),meeting_key:z.number().int().positive().optional(),date,message:z.string().max(4000),category:z.string().max(80).optional(),flag:z.string().max(80).nullable().optional(),driver_number:z.number().int().nullable().optional(),lap_number:z.number().int().nullable().optional(),sector:z.number().int().nullable().optional(),qualifying_phase:z.number().int().nullable().optional()});
const raceSchema=z.object({id:z.string(),name:z.string().optional(),round:z.number().optional(),status:z.string().optional(),schedule:z.array(z.object({id:z.string().optional(),type:z.string(),startDate:z.string(),endDate:z.string().optional()})).optional()});

export class OpenRaceEventsRepository implements RaceEventsRepository {
 private calendar:RaceDataService;
 private memo=new Map<string,{expires:number;value:unknown}>();
 private pending=new Map<string,Promise<unknown>>();
 constructor(private request:typeof fetch=fetch,private now=Date.now){this.calendar=new RaceDataService(new SharedRaceCache(),request,now);}
 async race(season:string,gp:string):Promise<EventRace|undefined>{
  const envelope=await this.calendar.get('/grands-prix?'+new URLSearchParams({season_id:season,page:'1',pageSize:'100',lang:'zh'}));
  const data=z.object({items:z.array(z.unknown()).max(100)}).parse(envelope.data);
  const candidate=data.items.find(item=>!!item&&typeof item==='object'&&'id' in item&&item.id===gp);
  return candidate?raceSchema.parse(candidate):undefined;
 }
 private async read<T>(path:string,schema:z.ZodType<T>,ttl:number):Promise<T>{
  const saved=this.memo.get(path);if(saved&&saved.expires>this.now())return saved.value as T;
  const pending=this.pending.get(path);if(pending)return pending as Promise<T>;
  const work=(async()=>{
   const response=await this.request('https://api.openf1.org/v1/'+path,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(8000),redirect:'manual'});
   if(!response.ok)throw new RaceEventsError('赛会记录暂未开放或无法读取，请稍后重试。');
   if(Number(response.headers.get('Content-Length'))>2*1024*1024){await response.body?.cancel();throw new RaceEventsError('赛会记录超出读取范围。');}
   const reader=response.body?.getReader();if(!reader)throw new RaceEventsError('赛会记录为空。');
   const decoder=new TextDecoder();let text='',size=0;
   try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>2*1024*1024){await reader.cancel();throw new RaceEventsError('赛会记录超出读取范围。');}text+=decoder.decode(part.value,{stream:true});}}finally{reader.releaseLock();}
   text+=decoder.decode();const value=schema.parse(JSON.parse(text));
   if(this.memo.size>=40)this.memo.clear();
   this.memo.set(path,{expires:this.now()+(Array.isArray(value)&&!value.length?60000:ttl),value});return value;
  })();
  this.pending.set(path,work);try{return await work;}finally{this.pending.delete(path);}
 }
 async sessions(year:number):Promise<ControlSession[]>{return this.read('sessions?'+new URLSearchParams({year:String(year),session_type:'Race'}),z.array(sessionSchema).max(200),3600000);}
 async weekend(meeting:number,session:number):Promise<{sessions:ControlSession[];drivers:ControlDriver[];messages:ControlMessage[]}>{
  const [sessions,messages,drivers]=await Promise.all([
   this.read('sessions?meeting_key='+meeting,z.array(sessionSchema).max(50),3600000),
   this.read('race_control?meeting_key='+meeting,z.array(messageSchema).max(10000),300000),
   this.read('drivers?session_key='+session,z.array(driverSchema).max(100),3600000).catch(()=>{console.warn(JSON.stringify({scope:'race-events',code:'DRIVER_NAMES_UNAVAILABLE'}));return [];}),
  ]);return {sessions,messages,drivers};
 }
}

export class SharedRaceEventsCache implements RaceEventsCache {
 private cache=new SharedRaceCache();
 async get(key:string){const value=await this.cache.get(key);if(!value||!value.data||typeof value.data!=='object')return undefined;const data=value.data as RaceEventsResult;if(!Array.isArray(data.items)||!Number.isFinite(Date.parse(value.updatedAt)))return undefined;return {data,checkedAt:Date.parse(value.updatedAt)};}
 async put(key:string,value:{data:RaceEventsResult;checkedAt:number}){await this.cache.put(key,{data:value.data,source:'live',updatedAt:new Date(value.checkedAt).toISOString()});}
}
