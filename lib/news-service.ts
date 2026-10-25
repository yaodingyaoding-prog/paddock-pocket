import {newsSources,parseNewsFeed} from './news-feed';
import type {NewsItem} from './editorial-news';
export type NewsFeed={items:NewsItem[];checkedAt:string;source:'live'|'cache'|'unavailable'};
type Stored={items:NewsItem[];checkedAt:string};
export class NewsService{
 private stored:Stored|undefined;private pending:Promise<NewsFeed>|undefined;private retryAt=0;
 constructor(private request:typeof fetch=fetch,private now=Date.now){}
 async load():Promise<NewsFeed>{
  const age=this.stored?this.now()-Date.parse(this.stored.checkedAt):Infinity;
  if(this.stored&&age<300000)return {...this.stored,source:'live'};
  if(this.now()<this.retryAt)return this.fallback();
  if(this.pending)return this.pending;
  this.pending=this.refresh();try{return await this.pending;}finally{this.pending=undefined;}
 }
 private fallback():NewsFeed{return this.stored?{...this.stored,source:'cache'}:{items:[],checkedAt:'',source:'unavailable'};}
 private async refresh():Promise<NewsFeed>{
  if(!this.stored)try{const cache=typeof caches==='undefined'?undefined:(caches as CacheStorage&{default?:Cache}).default;const hit=await cache?.match('https://news-cache.invalid/v1/feed');if(hit){const value=await hit.json() as Stored;if(Array.isArray(value.items)&&Number.isFinite(Date.parse(value.checkedAt)))this.stored=value;}}catch{}
  if(this.stored&&this.now()-Date.parse(this.stored.checkedAt)<300000)return {...this.stored,source:'live'};
  const results=await Promise.allSettled(newsSources.map(async source=>{
   const response=await this.request(source.url,{redirect:'manual',headers:{Accept:'application/rss+xml, application/xml, text/xml'},signal:AbortSignal.timeout(6000)});
   if(!response.ok)throw Error('NEWS_SOURCE_STATUS');
   const reader=response.body?.getReader();if(!reader)throw Error('NEWS_SOURCE_EMPTY');let length=0;const chunks:Uint8Array[]=[];
   while(true){const part=await reader.read();if(part.done)break;length+=part.value.length;if(length>512000){await reader.cancel();throw Error('NEWS_SOURCE_TOO_LARGE');}chunks.push(part.value);}
   const bytes=new Uint8Array(length);let offset=0;for(const part of chunks){bytes.set(part,offset);offset+=part.length;}
   return parseNewsFeed(new TextDecoder().decode(bytes),source,this.now());
  }));
  const items=[...new Map(results.flatMap(r=>r.status==='fulfilled'?r.value:[]).map(item=>[item.url,item])).values()].sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)).slice(0,40);
  if(!items.length){this.retryAt=this.now()+60000;console.warn(JSON.stringify({scope:'news',code:'NEWS_SOURCES_UNAVAILABLE'}));return this.fallback();}
  this.stored={items,checkedAt:new Date(this.now()).toISOString()};this.retryAt=0;
  try{const cache=typeof caches==='undefined'?undefined:(caches as CacheStorage&{default?:Cache}).default;await cache?.put('https://news-cache.invalid/v1/feed',Response.json(this.stored,{headers:{'Cache-Control':'public, max-age=86400'}}));}catch{}
  return {...this.stored,source:'live'};
 }
}
const service=new NewsService();
export async function handleNewsRequest(){const data=await service.load();return Response.json(data,{headers:{'Cache-Control':'public, max-age=60, s-maxage=60'}});}
