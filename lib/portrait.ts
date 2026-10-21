import index from './portrait-index.json';
import {snapshots} from './snapshots';
type Row=Record<string,any>;
const normal=(name:string)=>name.normalize('NFKD').replace(/[\p{M}\p{P}\p{Z}\s]/gu,'').toLowerCase();
const official=new Map<string,string>(((snapshots.drivers as Row).items[0].standings as Row[]).map(d=>[d.driverId,'/drivers/'+d.tla.toLowerCase()+'.webp']));
const images=index.images as Record<string,string>,identity=index.ids as Record<string,string>,names=index.names as Record<string,string>;
export function portraitFor(driver:Row):{file:string;historical:boolean}|undefined{
 const exact=official.get(driver.driverId);if(exact)return {file:exact,historical:false};
 const id=identity[driver.driverId];let image=id?images[id]:undefined;
 if(!image)for(const name of [driver.driverName,driver.name,driver.driverNameKey,driver.firstName&&driver.lastName?driver.firstName+' '+driver.lastName:'']){if(name&&names[normal(name)]){image=images[names[normal(name)]];break;}}
 return image?{file:image,historical:true}:undefined;
}
