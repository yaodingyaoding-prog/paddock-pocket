import {normalizeRaceEvents,controlSessionName,type EventRace,type ControlSession,type ControlDriver,type ControlMessage,type RaceEvent} from './race-events';

export type RaceEventsQuery={year:number;season:string;gp:string};
export type RaceEventsResult={
 state:'available'|'scheduled'|'collecting'|'unpublished'|'unsupported';raceId:string;raceName:string;year:number;
 raceStartDate:string;raceEndDate:string;mainSessionKey:number|null;sessions:{key:number;name:string}[];
 items:RaceEvent[];recordCount:number;sourceUrl:string;updatedAt:string;stale:boolean;
};
export interface RaceEventsRepository {
 race(season:string,gp:string):Promise<EventRace|undefined>;
 sessions(year:number):Promise<ControlSession[]>;
 weekend(meeting:number,session:number):Promise<{sessions:ControlSession[];drivers:ControlDriver[];messages:ControlMessage[]}>;
}
export interface RaceEventsCache {get(key:string):Promise<{data:RaceEventsResult;checkedAt:number}|undefined>;put(key:string,value:{data:RaceEventsResult;checkedAt:number}):Promise<void>}
export class RaceEventsError extends Error {constructor(message:string,public status=503){super(message);}}

export class RaceEventsService {
 private pending=new Map<string,Promise<RaceEventsResult>>();
 private failures=new Map<string,number>();
 constructor(private repository:RaceEventsRepository,private cache:RaceEventsCache,private now=Date.now){}
 async load(query:RaceEventsQuery){
  const key=['race-events-v1',query.season,query.year,query.gp].join('/'),pending=this.pending.get(key);
  if(pending)return pending;
  const work=this.resolve(query,key);this.pending.set(key,work);
  try{return await work;}finally{this.pending.delete(key);}
 }
 private async resolve(query:RaceEventsQuery,key:string):Promise<RaceEventsResult>{
  const at=this.now();
  const base:RaceEventsResult={state:'unpublished',raceId:query.gp,raceName:'',year:query.year,raceStartDate:'',raceEndDate:'',mainSessionKey:null,sessions:[],items:[],recordCount:0,sourceUrl:'https://openf1.org/docs/#race-control',updatedAt:new Date(at).toISOString(),stale:false};
  if(query.year<2023)return {...base,state:'unsupported'};
  const saved=await this.cache.get(key).catch(()=>undefined),age=saved?at-saved.checkedAt:Infinity;
  const boundaryValid=!saved||saved.data.state!=='scheduled'&&saved.data.state!=='collecting'||Date.parse(saved.data.state==='scheduled'?saved.data.raceStartDate:saved.data.raceEndDate)>at;
  if(saved&&age>=0&&age<(saved.data.state==='available'?300000:60000)&&boundaryValid)return saved.data;
  const fallback=()=>{if(saved?.data.state==='available'&&age>=0&&age<=21600000)return {...saved.data,stale:true};throw new RaceEventsError('赛会记录暂时无法读取，请稍后重试。');};
  if((this.failures.get(key)||0)>at)return fallback();
  try{
   const race=await this.repository.race(query.season,query.gp);
   if(!race)throw new RaceEventsError('未找到这场比赛。',404);
   const main=race.schedule?.find(session=>session.type==='MainRace');
   const context={...base,raceName:race.name||'',raceStartDate:main?.startDate||'',raceEndDate:main?.endDate||''};
   let result:RaceEventsResult=context;
   if(main){
    const start=Date.parse(main.startDate),end=Date.parse(main.endDate||'');
    if(!Number.isFinite(start)||new Date(start).getUTCFullYear()!==query.year)throw new RaceEventsError('比赛与所选赛季不一致。',400);
    if(start>at)result={...context,state:'scheduled'};
    else if(Number.isFinite(end)&&end>at)result={...context,state:'collecting'};
    else{
     const matches=(await this.repository.sessions(query.year)).filter(session=>session.year===query.year&&session.session_name==='Race'&&!session.is_cancelled&&Math.abs(Date.parse(session.date_start)-start)<=6*3600000);
     if(matches.length===1){
      const matched=matches[0],bundle=await this.repository.weekend(matched.meeting_key,matched.session_key);
      const sessions=bundle.sessions.filter(session=>session.meeting_key===matched.meeting_key&&session.year===query.year&&!session.is_cancelled);
      if(!sessions.some(session=>session.session_key===matched.session_key))throw new RaceEventsError('赛会场次记录暂不完整，请稍后重试。');
      const known=new Set(sessions.map(session=>session.session_key));
      const messages=bundle.messages.filter(message=>known.has(message.session_key)&&(!message.meeting_key||message.meeting_key===matched.meeting_key)&&Date.parse(message.date)<=at);
      result={...context,state:messages.length?'available':'unpublished',mainSessionKey:matched.session_key,sessions:sessions.map(session=>({key:session.session_key,name:controlSessionName(session.session_name)})),items:normalizeRaceEvents(messages,sessions,bundle.drivers),recordCount:messages.length,sourceUrl:'https://api.openf1.org/v1/race_control?meeting_key='+matched.meeting_key};
     }
    }
   }
   await this.cache.put(key,{data:result,checkedAt:at}).catch(()=>undefined);
   this.failures.delete(key);return result;
  }catch(error){
   if(error instanceof RaceEventsError&&error.status<500)throw error;
   console.warn(JSON.stringify({scope:'race-events',code:'UPSTREAM_UNAVAILABLE',reason:error instanceof Error?error.name:'unknown',detail:error instanceof TypeError?error.message.slice(0,180):undefined}));
   if(this.failures.size>=80)this.failures.clear();this.failures.set(key,at+60000);return fallback();
  }
 }
}
