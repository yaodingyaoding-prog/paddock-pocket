export type RaceEnvelope = {data:unknown;source:'live'|'cache'|'snapshot';updatedAt:string};
export interface RaceCache {get(key:string):Promise<RaceEnvelope|undefined>;put(key:string,value:RaceEnvelope):Promise<void>}
export class SharedRaceCache implements RaceCache {
 private memory=new Map<string,RaceEnvelope>();
 private edge(){return typeof caches==='undefined'?undefined:(caches as CacheStorage & {default?:Cache}).default;}
 private key(path:string){return 'https://race-cache.invalid/v2/'+encodeURIComponent(path);}
 async get(path:string){const local=this.memory.get(path);if(local)return local;try{const r=await this.edge()?.match(this.key(path));if(r){const value=await r.json() as RaceEnvelope;if(value.data!=null&&Number.isFinite(Date.parse(value.updatedAt))){this.memory.set(path,value);return value;}}}catch{}return undefined;}
 async put(path:string,value:RaceEnvelope){if(this.memory.size>=180)this.memory.clear();this.memory.set(path,value);try{await this.edge()?.put(this.key(path),Response.json(value,{headers:{'Cache-Control':'public, max-age=21600'}}));}catch{}}
}
export class RaceDataService {
 private pending=new Map<string,Promise<RaceEnvelope>>();private failures=new Map<string,number>();
 constructor(private cache:RaceCache,private request:typeof fetch=fetch,private now=Date.now){}
 async get(path:string,fallback?:RaceEnvelope){const pending=this.pending.get(path);if(pending)return pending;const work=this.load(path,fallback);this.pending.set(path,work);try{return await work;}finally{this.pending.delete(path);}}
 private async load(path:string,fallback?:RaceEnvelope){
  const at=this.now(),saved=await this.cache.get(path).catch(()=>undefined),age=saved?at-Date.parse(saved.updatedAt):Infinity;
  if(saved&&age>=0&&age<60000)return {...saved,source:'live' as const};
  const restore=()=>{if(saved&&age>=0&&age<21600000)return {...saved,source:'cache' as const};if(fallback)return fallback;throw Error('RACE_DATA_UNAVAILABLE');};
  if((this.failures.get(path)||0)>at)return restore();
  try{const r=await this.request('https://api.f1push.com/api/v1'+path,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(6500)});if(!r.ok)throw Error('RACE_UPSTREAM');const j=await r.json() as {code:number;data:unknown};if(![0,200].includes(j.code)||j.data==null)throw Error('RACE_FORMAT');const value:RaceEnvelope={data:j.data,source:'live',updatedAt:new Date(this.now()).toISOString()};await this.cache.put(path,value);this.failures.delete(path);return value;}catch{if(this.failures.size>=180)this.failures.clear();this.failures.set(path,at+45000);return restore();}
 }
}
