export const racePoints = [25,18,15,12,10,8,6,4,2,1,0];
export const sprintPoints = [8,7,6,5,4,3,2,1,0];
export type Rival = { driverId:string; driverName:string; points:number; wins?:number };
export type Condition = { rival:Rival; maxPoints:number; allowed:{race:number;sprint:number;points:number;tie:boolean;tieSafe:boolean}[] };

// Normal full-points races. Equality is deliberately separated until complete countback data exists.
export function clinchConditions(target:Rival, rivals:Rival[], mainPosition:number, sprintPosition:number|null, remainingAfter:number, racesAfter:number):Condition[] {
  const earned = racePoints[mainPosition-1] + (sprintPosition === null ? 0 : sprintPoints[sprintPosition-1]);
  const total = target.points + earned;
  return rivals.filter(r=>r.driverId !== target.driverId).map(rival=>{
    const maxPoints = total - rival.points - remainingAfter;
    const allowed:Condition['allowed'] = [];
    for(let r=1;r<=11;r++) for(let s=1;s<=(sprintPosition===null?1:9);s++) {
      if ((r===mainPosition && r<=10) || (sprintPosition!==null && s===sprintPosition && s<=8)) continue;
      const points = racePoints[r-1]+(sprintPosition===null?0:sprintPoints[s-1]);
      const tieSafe = typeof target.wins==='number' && typeof rival.wins==='number' && target.wins+(mainPosition===1?1:0)>rival.wins+(r===1?1:0)+racesAfter;
      if(points<=maxPoints) allowed.push({race:r,sprint:s,points,tie:points===maxPoints,tieSafe});
    }
    return {rival,maxPoints,allowed};
  });
}
