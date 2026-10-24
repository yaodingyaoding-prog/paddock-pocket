export type DataStamp={source:string;updatedAt:string};
export function conservativeDataStamp(values:DataStamp[],fallback:DataStamp):DataStamp{
 const valid=values.filter(v=>Number.isFinite(Date.parse(v.updatedAt)));
 if(!valid.length)return fallback;
 return {source:valid.some(v=>v.source==='snapshot')?'snapshot':valid.some(v=>v.source!=='live')?'cache':'live',updatedAt:valid.reduce((oldest,v)=>Date.parse(v.updatedAt)<Date.parse(oldest.updatedAt)?v:oldest).updatedAt};
}
