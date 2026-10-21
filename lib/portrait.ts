import historical from './driver-portraits.json';
import identities from './driver-portrait-identities.json';
import {snapshots} from './snapshots';
type Row=Record<string,any>;
const normal=(name:string)=>name.normalize('NFKD').replace(/[\p{M}\p{P}\p{Z}\s]/gu,'').toLowerCase();
const official=new Map<string,string>(((snapshots.drivers as Row).items[0].standings as Row[]).map(d=>[d.driverId,'/drivers/'+d.tla.toLowerCase()+'.webp']));
const byId=historical.drivers as Record<string,Row>,identity=(identities as any).drivers as Record<string,Row>;
const byName=new Map<string,Row>();
for(const person of Object.values(byId)){
 if(!person.image)continue;
 for(const name of [person.givenName+' '+person.familyName,person.wikidataNameZh,person.wikidataLabel,...Object.values(identity).filter(r=>r.jolpicaDriverId===person.driverId).flatMap(r=>r.aliases||[])]){
  if(typeof name==='string'&&name.length>2)byName.set(normal(name),person);
 }
}
export function portraitFor(driver:Row):{file:string;historical:boolean}|undefined{
 const exact=official.get(driver.driverId);if(exact)return {file:exact,historical:false};
 const id=identity[driver.driverId]?.jolpicaDriverId;let match=id?byId[id]:undefined;
 if(!match?.image)for(const name of [driver.driverName,driver.name,driver.driverNameKey,driver.firstName&&driver.lastName?driver.firstName+' '+driver.lastName:'']){if(name&&byName.has(normal(name))){match=byName.get(normal(name));break;}}
 return match?.image?{file:match.image,historical:true}:undefined;
}
