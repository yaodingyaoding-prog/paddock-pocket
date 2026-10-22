type CacheStorage=Pick<Storage,'key'|'getItem'|'removeItem'|'length'>;
// Only disposable app data is touched. Account cookies and user preferences are preserved.
export function pruneClientCache(storage:CacheStorage,now=Date.now()){
 try{
  const keys=Array.from({length:storage.length},(_,i)=>storage.key(i)).filter((s):s is string=>!!s);
  for(const key of keys){
   if(key==='paddock-cache'||key.startsWith('paddock-weather-v2-')){
    try{const value=JSON.parse(storage.getItem(key)||'null');const stamp=key==='paddock-cache'?value?.storedAt:value?.fetchedAt;const ttl=key==='paddock-cache'?86400000:21600000;if(!Number.isFinite(stamp)||now-stamp<0||now-stamp>ttl)storage.removeItem(key);}catch{storage.removeItem(key);}
   }else if(key.startsWith('paddock-weather-v1-'))storage.removeItem(key);
  }
 }catch{/* Storage can be unavailable in private or restricted browsers. */}
}
