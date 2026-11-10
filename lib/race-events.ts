export type EventKind = 'red'|'yellow'|'safety'|'penalty';
export type EventFilter = 'all'|'flags'|'safety'|'penalty';
export type EventRace = {id:string;name?:string;round?:number;status?:string;schedule?:{id?:string;type:string;startDate:string;endDate?:string}[]};
export type ControlSession = {session_key:number;meeting_key:number;year:number;session_name:string;date_start:string;date_end:string;is_cancelled?:boolean};
export type ControlDriver = {driver_number:number;name_acronym:string;full_name:string};
export type ControlMessage = {meeting_key?:number;session_key:number;date:string;message:string;category?:string;flag?:string|null;driver_number?:number|null;sector?:number|null;lap_number?:number|null;qualifying_phase?:number|null};
export type EventDriver = {number:number;acronym:string;name:string};
export type RaceEvent = {
 id:string;kind:EventKind;title:string;date:string;sessionKey:number;sessionName:string;lap:number|null;phase:'pre'|'race'|'post';qualifyingPhase?:number;
 drivers:EventDriver[];reason:string;rawMessages:string[];sectors:number[];status:'issued'|'cancelled';
 isGridPenalty:boolean;servedAt?:string;endNotice?:string;cause:string|null;
 related:{date:string;message:string;drivers:EventDriver[]}[];
};

export function controlSessionName(name:string) {
 return ({Race:'正赛',Sprint:'冲刺赛',Qualifying:'排位赛','Sprint Qualifying':'冲刺排位赛','Sprint Shootout':'冲刺排位赛','Practice 1':'一练','Practice 2':'二练','Practice 3':'三练'} as Record<string,string>)[name]||name;
}

function referencedDrivers(row:ControlMessage,roster:ControlDriver[]):EventDriver[] {
 const refs=[...row.message.matchAll(/\b(\d{1,3})\s*\(([A-Z]{2,4})\)/g)].map(match=>({number:Number(match[1]),acronym:match[2]}));
 if(!refs.length&&Number.isInteger(row.driver_number)&&row.driver_number!>0)refs.push({number:row.driver_number!,acronym:''});
 return refs.filter((ref,index)=>refs.findIndex(other=>other.number===ref.number)===index).map(ref=>{
  const driver=roster.find(item=>ref.acronym?item.name_acronym===ref.acronym:item.driver_number===ref.number);
  return {...ref,acronym:ref.acronym||driver?.name_acronym||'',name:driver?.full_name||ref.acronym||'#'+ref.number};
 });
}

function penaltyTitle(message:string) {
 const grid=message.match(/(\d+)[ -]*(?:PLACE|POSITION)[ -]*(?:GRID[ -]*)?(?:PENALTY|DROP)/)||message.match(/(\d+)[ -]*GRID[ -]*(?:PLACE|POSITION)S?[ -]*PENALTY/)||message.match(/DROP OF (\d+) GRID POSITIONS/);
 if(grid)return '罚退 '+grid[1]+' 位';
 const stop=message.match(/(\d+)[ -]*SECOND(?:S)?[ -]*(?:STOP[ /-]*(?:AND[ -]*)?GO)/);
 if(stop)return '停站 '+stop[1]+' 秒';
 const time=message.match(/(\d+(?:\.\d+)?)[ -]*(?:SECOND|SECONDS)[ -]*(?:TIME[ -]*)?PENALTY/);
 if(time)return '加罚 '+time[1]+' 秒';
 if(/DRIVE[ -]THROUGH/.test(message))return '通过维修区处罚';
 if(/DISQUALIF/.test(message))return '取消资格';
 if(/REPRIMAND/.test(message))return '训诫';
 if(/FINE/.test(message))return '罚款';
 if(/BLACK FLAG/.test(message))return '黑旗';
 return '处罚决定';
}

function eventReason(message:string) {
 const reason=message.split(/\s+-\s+/).slice(1).join(' - ').replace(/\s*\(\d{1,2}:\d{2}:\d{2}\)\s*$/,'').trim();
 const translations:[RegExp,string][]=[
  [/REJOINING UNSAFELY|UNSAFE REJOIN/,'不安全返回赛道'],[/LEAVING THE TRACK AND GAINING AN ADVANTAGE/,'驶离赛道并获利'],
  [/CAUSING A COLLISION/,'引发碰撞'],[/YELLOW FLAG INFRINGEMENT/,'违反黄旗规定'],[/SPEEDING IN THE PIT LANE/,'维修区超速'],
  [/UNSAFE RELEASE/,'不安全释放'],[/IMPEDING/,'阻挡其他赛车'],[/FALSE START|JUMP START/,'抢跑'],
  [/TRACK LIMITS/,'超出赛道界限'],[/IGNORING BLUE FLAGS|BLUE FLAG INFRINGEMENT/,'违反蓝旗规定'],
  [/UNNECESSARILY SLOW/,'不必要地慢速驾驶'],[/ADDITIONAL POWER UNIT|POWER UNIT ELEMENTS/,'超额使用动力单元部件'],
  [/GEARBOX/,'变速箱相关违规'],[/PIT LANE START/,'从维修区发车'],[/REVERSING IN THE PIT LANE/,'在维修区倒车'],
 ];
 return translations.find(([pattern])=>pattern.test(reason))?.[1]||reason.slice(0,250);
}

export function normalizeRaceEvents(input:ControlMessage[],sessions:ControlSession[],roster:ControlDriver[]):RaceEvent[] {
 const known=new Map(sessions.map(session=>[session.session_key,session]));
 const seen=new Set<string>();
 const rows=input.filter(row=>{
  if(!row||!known.has(row.session_key)||typeof row.message!=='string'||!Number.isFinite(Date.parse(row.date))||row.message.length>4000)return false;
  const key=[row.session_key,row.date,row.message,row.sector].join('|');
  if(seen.has(key))return false;seen.add(key);return true;
 }).sort((a,b)=>Date.parse(a.date)-Date.parse(b.date));
 const chequered=new Map<number,number>();
 for(const row of rows)if(row.flag==='CHEQUERED')chequered.set(row.session_key,Date.parse(row.date));
 const events:RaceEvent[]=[];
 for(const row of rows){
  const upper=row.message.toUpperCase(),session=known.get(row.session_key)!,drivers=referencedDrivers(row,roster);
  const at=Date.parse(row.date),phase=at<Date.parse(session.date_start)?'pre':at>(chequered.get(row.session_key)??Infinity)?'post':'race';
  const common={date:row.date,sessionKey:row.session_key,sessionName:controlSessionName(session.session_name),lap:Number.isInteger(row.lap_number)&&row.lap_number!>0?row.lap_number!:null,phase,qualifyingPhase:row.qualifying_phase&&row.qualifying_phase>=1&&row.qualifying_phase<=3?row.qualifying_phase:undefined,drivers,rawMessages:[row.message],sectors:[] as number[],status:'issued' as const,isGridPenalty:false,cause:null,related:[]} satisfies Partial<RaceEvent>;
  const flag=row.flag?.toUpperCase();
  if(flag==='RED'||flag==='YELLOW'||flag==='DOUBLE YELLOW'||/^YELLOW IN PIT LANE\b/.test(upper)){
   const kind=flag==='RED'?'red':'yellow',title=kind==='red'?'红旗':flag==='DOUBLE YELLOW'?'双黄旗':'黄旗';
   const group=events.find(event=>event.kind===kind&&event.sessionKey===row.session_key&&event.date===row.date);
   const sector=Number.isInteger(row.sector)&&row.sector!>0?row.sector!:null;
   if(group){if(title==='双黄旗')group.title=title;if(sector&&!group.sectors.includes(sector))group.sectors.push(sector);if(!group.rawMessages.includes(row.message))group.rawMessages.push(row.message);continue;}
   events.push({...common,id:[row.session_key,row.date,kind].join(':'),kind,title,reason:/PIT LANE/.test(upper)?'维修区':'',sectors:sector?[sector]:[]});
   continue;
  }
  if(/\b(?:SAFETY CAR|VSC)\b/.test(upper)){
   const virtual=/\bVSC\b|VIRTUAL SAFETY CAR/.test(upper),title=virtual?'虚拟安全车出动':'安全车出动';
   if(/\bDEPLOYED\b/.test(upper)){
    const cause=upper.match(/(?:DUE TO|CAUSED BY|BECAUSE OF)\s+(.+)/)?.[1]||null;
    const related=rows.filter(other=>other.session_key===row.session_key&&Math.abs(Date.parse(other.date)-at)<=90000&&/\bCAR(?:S)?\b/.test(other.message)&&/STOPPED|CRASH|COLLISION/i.test(other.message)&&other!==row).slice(0,3).map(other=>({date:other.date,message:other.message,drivers:referencedDrivers(other,roster)}));
    events.push({...common,id:[row.session_key,row.date,'safety'].join(':'),kind:'safety',title,reason:cause?'':'原因未注明',cause,related});
   }else if(/ENDING|IN THIS LAP|WITHDRAWN/.test(upper)){
    const deployment=[...events].reverse().find(event=>event.kind==='safety'&&event.sessionKey===row.session_key&&event.title===title&&!event.endNotice);
    if(deployment){deployment.endNotice=row.date;deployment.rawMessages.push(row.message);}
   }
   continue;
  }
  if(/PENALTY SERVED|PENALTY (?:CANCELLED|CANCELED|WITHDRAWN|REVOKED)|(?:CANCELLED|CANCELED|WITHDRAWN|REVOKED).*PENALTY/.test(upper)){
   const title=penaltyTitle(upper),served=/PENALTY SERVED/.test(upper);
   let candidates=events.filter(event=>event.kind==='penalty'&&event.sessionKey===row.session_key&&drivers.length>0&&drivers.every(driver=>event.drivers.some(other=>other.number===driver.number))&&(event.title===title||title==='处罚决定'));
   const reference=upper.match(/\((\d{1,2}:\d{2}:\d{2})\)\s*$/)?.[1];
   if(reference)candidates=candidates.filter(event=>event.rawMessages[0].match(/\((\d{1,2}:\d{2}:\d{2})\)\s*$/)?.[1]===reference);
   const reasonText=upper.match(/\bCARS?\b.+?\s+-\s+(.+)/)?.[1];
   if(reasonText&&!/PENALTY (?:SERVED|CANCELLED|CANCELED|WITHDRAWN|REVOKED)/.test(reasonText))candidates=candidates.filter(event=>event.reason===eventReason(' - '+reasonText));
   candidates=candidates.filter(event=>event.status!=='cancelled'&&(!served||!event.servedAt));
   const previous=candidates.length===1?candidates[0]:undefined;
   if(previous){previous.rawMessages.push(row.message);if(/PENALTY SERVED/.test(upper))previous.servedAt??=row.date;else previous.status='cancelled';}
   continue;
  }
  if(/UNDER INVESTIGATION|WILL BE INVESTIGATED|NOTED|NO FURTHER ACTION|NO PENALTY/.test(upper))continue;
  if(/PENALTY|GRID DROP|DROP OF \d+ GRID POSITIONS|DISQUALIF|REPRIMAND|FINE FOR|BLACK FLAG/.test(upper)){
   const title=penaltyTitle(upper);
   events.push({...common,id:[row.session_key,row.date,'penalty',drivers.map(driver=>driver.number).join('-')].join(':'),kind:'penalty',title,reason:eventReason(upper),isGridPenalty:title.startsWith('罚退')});
  }
 }
 return events.map(event=>({...event,sectors:event.sectors.sort((a,b)=>a-b)})).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
}

export function defaultEventRace<T extends EventRace>(races:T[],focusedId:string,now:number):T|undefined {
 const focused=races.find(race=>race.id===focusedId);if(focused)return focused;
 const completed=races.map(race=>({race,session:race.schedule?.find(session=>session.type==='MainRace')})).filter(({session})=>session&&Date.parse(session.endDate||session.startDate)<now).sort((a,b)=>Date.parse(b.session!.startDate)-Date.parse(a.session!.startDate));
 return completed[0]?.race||races[0];
}

export function visibleRaceEvents(events:RaceEvent[],filter:EventFilter,expanded:boolean):RaceEvent[] {
 const matching=events.filter(event=>filter==='all'||(filter==='flags'?(event.kind==='red'||event.kind==='yellow'):event.kind===filter));
 if(expanded||matching.length<=3)return matching;
 if(filter!=='all')return matching.slice(0,3);
 return [...matching].sort((a,b)=>Number(b.kind!=='yellow')-Number(a.kind!=='yellow')||Date.parse(b.date)-Date.parse(a.date)).slice(0,3).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
}
