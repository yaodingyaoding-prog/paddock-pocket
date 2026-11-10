'use client';
import {useEffect,useRef,useState} from 'react';
import {ChevronDown,ExternalLink,Flag,RefreshCw,Scale,ShieldAlert} from 'lucide-react';
import {readPublicJson} from '../lib/public-read';
import {defaultEventRace,visibleRaceEvents,raceEventExplanation,type EventRace,type EventFilter,type EventDriver,type RaceEvent} from '../lib/race-events';
import type {RaceEventsResult} from '../lib/race-events-service';
import './race-events.css';

type Driver={number?:number|string;driverName?:string};
type Props={races:EventRace[];season:string;year:number;focusedRaceId?:string;now:number;timezone:string;drivers:Driver[]};
const filters:{id:EventFilter;label:string}[]=[{id:'all',label:'全部'},{id:'flags',label:'红黄旗'},{id:'safety',label:'安全车'},{id:'penalty',label:'处罚'}];

export function RaceEventsCard({races,season,year,focusedRaceId='',now,timezone,drivers}:Props){
 const context=season+'/'+focusedRaceId;
 const [choice,setChoice]=useState({context:'',raceId:''});
 const race=races.find(race=>choice.context===context&&race.id===choice.raceId)||defaultEventRace(races,focusedRaceId,now);
 const key=[season,year,race?.id||''].join('/');
 const [enabled,setEnabled]=useState(false),[retry,setRetry]=useState(0);
 const [result,setResult]=useState<{key:string;data?:RaceEventsResult;error?:string}>({key:''});
 const [filter,setFilter]=useState<EventFilter>('all'),[scope,setScope]=useState('all'),[expanded,setExpanded]=useState(false);
 const host=useRef<HTMLElement>(null);
 useEffect(()=>{
  if(enabled||!host.current)return;
  if(typeof IntersectionObserver==='undefined'){setEnabled(true);return;}
  const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){setEnabled(true);observer.disconnect();}},{rootMargin:'300px'});
  observer.observe(host.current);return()=>observer.disconnect();
 },[enabled]);
 useEffect(()=>{
  if(!enabled||!race?.id)return;
  const controller=new AbortController();setResult({key});setExpanded(false);setFilter('all');setScope('all');
  readPublicJson<{data:RaceEventsResult}>('/api/race-events?'+new URLSearchParams({season,year:String(year),gp:race.id}),{signal:controller.signal,timeoutMs:30000})
   .then(value=>{if(!controller.signal.aborted){if(!value.data||value.data.raceId!==race.id||value.data.year!==year)throw Error('比赛记录不匹配，请重试。');setResult({key,data:value.data});}})
   .catch(error=>{if(!controller.signal.aborted)setResult({key,error:error instanceof Error?error.message:'赛会记录暂时无法读取。'});});
  return()=>controller.abort();
 },[enabled,key,race?.id,retry,season,year]);
 const data=result.key===key?result.data:undefined,error=result.key===key?result.error:undefined;
 const loading=!!race&&enabled&&!data&&!error;
 const available=data?.state==='available';
 const scoped=available?data.items.filter(event=>scope==='all'||String(event.sessionKey)===scope):[];
 const rows=visibleRaceEvents(scoped,filter,expanded),matching=visibleRaceEvents(scoped,filter,true);
 const counts={all:scoped.length,flags:scoped.filter(event=>event.kind==='red'||event.kind==='yellow').length,safety:scoped.filter(event=>event.kind==='safety').length,penalty:scoped.filter(event=>event.kind==='penalty').length};
 const name=(driver:EventDriver)=>drivers.find(row=>String(row.number)===String(driver.number))?.driverName||driver.name;
 const names=(event:RaceEvent)=>event.drivers.map(driver=>name(driver)+' #'+driver.number).join('、');
 const shortTime=(date:string)=>new Date(date).toLocaleTimeString('zh-CN',{timeZone:timezone,hour:'2-digit',minute:'2-digit',hour12:false});
 const fullTime=(date:string)=>new Date(date).toLocaleString('zh-CN',{timeZone:timezone,month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
 const stateText=!race?'正在读取赛历…':!enabled||loading?'正在读取赛会记录…':error?error:data?.state==='scheduled'?'比赛尚未开始，赛后可查看记录。':data?.state==='collecting'?'比赛进行中，赛后更新赛会记录。':data?.state==='unsupported'?'当前数据源支持 2023 年及之后的比赛。':data?.state==='unpublished'?'本场赛会记录尚未发布，可稍后刷新。':'该范围暂无已记录的事件。';
 return <section className="race-events-card" ref={host} aria-labelledby="race-events-title" aria-busy={loading}>
  <header className="race-events-heading"><h2 id="race-events-title">赛会记录</h2>
   <select aria-label="赛会记录分站" value={race?.id||''} disabled={!races.length} onChange={event=>{setChoice({context,raceId:event.target.value});setExpanded(false);}}>{races.map(race=><option key={race.id} value={race.id}>{race.name||'第 '+race.round+' 站'}</option>)}</select>
   <button type="button" className="icon-button" aria-label="刷新赛会记录" disabled={loading||!race} onClick={()=>setRetry(value=>value+1)}><RefreshCw size={15}/></button>
  </header>
  <div className="race-events-selectors">
   <select aria-label="赛会记录场次" value={scope} disabled={!available} onChange={event=>{setScope(event.target.value);setExpanded(false);}}><option value="all">整个周末</option>{data?.sessions.map(session=><option key={session.key} value={session.key}>{session.name}</option>)}</select>
   <div className="race-events-filters" role="group" aria-label="赛会事件类型">{filters.map(item=><button type="button" key={item.id} className={'events-filter-'+item.id} aria-pressed={filter===item.id} disabled={!available} onClick={()=>{setFilter(item.id);setExpanded(false);}}><span>{item.label}</span><b>{available?counts[item.id]:'—'}</b></button>)}</div>
  </div>
  {data?.stale&&<p className="race-events-state" role="status">更新暂未成功，当前显示上次读取的记录。</p>}
  {available&&rows.length?<ol className="race-events-list" data-expanded={expanded}>{rows.map(event=>{
   const Icon=event.kind==='safety'?ShieldAlert:event.kind==='penalty'?Scale:Flag;
   const phase=event.qualifyingPhase?'Q'+event.qualifyingPhase:event.phase==='pre'?'赛前':event.phase==='post'?'赛后':event.lap?'第'+event.lap+'圈':shortTime(event.date);
   const controlled=event.kind!=='penalty',explanation=raceEventExplanation(event,name);
   const location=event.reason&&event.kind!=='safety'?event.reason:event.sectors.length?'赛道区域 '+event.sectors.join('、'):'';
   const detail=controlled?explanation.reason:event.reason;
   return <li key={event.id} className={'race-event-'+event.kind}>
    <details>
     <summary>
      <span className="race-event-phase"><Icon size={15}/>{phase}<small>{event.sessionName}</small></span>
      <span className="race-event-copy">
       <strong>{event.title}{event.status==='cancelled'?<em>已撤销</em>:event.servedAt?<em>已执行</em>:null}</strong>
       {names(event)&&!event.cause&&<span className="race-event-drivers">{controlled?'消息涉及：':''}{names(event)}</span>}
       {detail&&<span className="race-event-reason">{detail}</span>}
       {controlled&&location&&<small>{location}</small>}
       {controlled&&explanation.related&&<span className="race-event-reason">{explanation.related}</span>}
      </span>
      <ChevronDown size={14}/>
     </summary>
     <div className="race-event-details">
      <time dateTime={event.date}>{fullTime(event.date)} / {timezone}</time>
      {event.endNotice&&<p>结束通知：{shortTime(event.endNotice)}</p>}
      {event.rawMessages.map((message,index)=><p key={index}>{message}</p>)}
      {event.related.length>0&&<div className="race-event-related"><b>同期赛会消息 · 与出旗关联未确认</b>{event.related.map((related,index)=><p key={index}>{shortTime(related.date)} {related.drivers.map(name).join('、')}<br/>{related.message}</p>)}</div>}
     </div>
    </details>
   </li>;
  })}</ol>:<p className="race-events-state" role="status">{stateText}{error&&<button type="button" onClick={()=>setRetry(value=>value+1)}>重试</button>}</p>}
  <footer className="race-events-footer">{matching.length>3&&<button type="button" aria-expanded={expanded} onClick={()=>setExpanded(value=>!value)}>{expanded?'收起记录':'查看全部 '+matching.length+' 条'}<ChevronDown size={14}/></button>}<a href={data?.sourceUrl||'https://openf1.org/docs/#race-control'} target="_blank" rel="noopener noreferrer">OpenF1<ExternalLink size={11}/></a></footer>
 </section>;
}
