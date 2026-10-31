'use client';
import {createElement,useEffect,useState} from 'react';
import {CloudSun,Sun,CloudRain,CloudFog,Snowflake,CloudLightning,Wind,Droplets,RefreshCw,Info} from 'lucide-react';
import {circuitLocations} from '../lib/circuit-locations';
import circuitExtra from '../lib/circuit-extra.json';
import {weatherRefreshMs,weatherHourIndex,weatherForecastStatus,weatherSessionName,WeatherSession} from '../lib/weather';
import './weather.css';
type Row=Record<string,any>;
type SavedWeather={data:Row;fetchedAt:number;stale?:boolean};
const value=(n:unknown,unit='')=>typeof n==='number'&&Number.isFinite(n)?Math.round(n)+unit:'—';
const weatherText=(code:number)=>code===0?'晴':code<4?'多云':code<50?'雾':code<60?'毛毛雨':code<70?'雨':code<80?'雪':code<85?'阵雨':code<90?'阵雪':'雷暴';
const iconFor=(code:number)=>code===0?Sun:code>=95?CloudLightning:code>=71&&code<=77||code===85||code===86?Snowflake:code>=51?CloudRain:code>=40?CloudFog:CloudSun;
export function WeatherCard({race,timezone:_timezone}:{race:Row;timezone:string}){
 const exact=(circuitExtra as Record<string,Row>)[race.circuit?.id];
 const coordinates=exact&&Number.isFinite(exact.latitude)&&Number.isFinite(exact.longitude)?[exact.latitude,exact.longitude]:circuitLocations[race.circuit?.nameKey];
 const key=coordinates?.join(',')||'',sessions=(race.schedule||[]) as WeatherSession[],sessionKey=JSON.stringify(sessions.map(s=>[s.id,s.startDate,s.endDate]));
 const [state,setState]=useState<{saved?:SavedWeather;error?:string;loading:boolean}>({loading:true}),[retry,setRetry]=useState(0),[chosen,setChosen]=useState(''),[now,setNow]=useState(Date.now());
 useEffect(()=>{setChosen('');},[race.id]);
 useEffect(()=>{
  const controller=new AbortController();let saved:SavedWeather|undefined,inFlight=false,lastFailure=0;
  try{const cached=JSON.parse(localStorage.getItem('paddock-weather-v2-'+key)||'null');if(Array.isArray(cached?.data?.hourly?.time)&&Array.isArray(cached.data.hourly.temperature_2m)&&Number.isFinite(cached.fetchedAt)&&Date.now()-cached.fetchedAt>=0&&Date.now()-cached.fetchedAt<6*3600000)saved=cached;}catch{}
  setState({saved,loading:!saved,...(saved?.stale?{error:'天气更新失败，请重试。'}:{})});
  async function tick(force=false){
   const at=Date.now();setNow(at);if(document.hidden||inFlight||controller.signal.aborted)return;
   if(saved&&at-saved.fetchedAt>=6*3600000)saved=undefined;
   if(!navigator.onLine){setState({saved,loading:false,error:'当前离线，请检查网络。'});return;}
   if(!key){setState({loading:false,error:'这条赛道的位置尚未收录。'});return;}
    if(!force&&(saved&&!saved.stale&&at-saved.fetchedAt<weatherRefreshMs(sessions,at)||at-lastFailure<60000))return;
   inFlight=true;if(!saved)setState({loading:true});
   try{
    const response=await fetch('/api/weather?'+new URLSearchParams({location:key}),{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(15000)])});
    if(!response.ok)throw Error('Weather HTTP '+response.status);
    const payload=await response.json() as Row;const data=payload.data;if(!Array.isArray(data?.hourly?.time)||!Array.isArray(data.hourly.temperature_2m))throw Error('Weather format');
    if(controller.signal.aborted)return;saved={data,fetchedAt:payload.fetchedAt,stale:payload.stale===true};setState({saved,loading:false,...(payload.stale?{error:'天气更新失败，请重试。'}:{})});
    try{localStorage.setItem('paddock-weather-v2-'+key,JSON.stringify(saved));}catch{}
   }catch{if(!controller.signal.aborted){lastFailure=Date.now();setState({saved,loading:false,error:'天气更新失败，请稍后重试。'});}}finally{inFlight=false;}
  }
  tick(retry>0);const timer=setInterval(()=>tick(),60000),resume=()=>{tick();};document.addEventListener('visibilitychange',resume);window.addEventListener('online',resume);
  return()=>{controller.abort();clearInterval(timer);document.removeEventListener('visibilitychange',resume);window.removeEventListener('online',resume);};
 },[key,sessionKey,retry]);
 const d=state.saved?.data,zone=typeof d?.timezone==='string'?d.timezone:'UTC';
 const main=sessions.find(s=>s.type==='MainRace')||sessions[0],session=sessions.find(s=>s.id===chosen)||main;
 const times:number[]=d?.hourly?.time||[],index=weatherHourIndex(times,session?Date.parse(session.startDate)/1000:NaN),status=weatherForecastStatus(session,times,now);
 const active=status==='available'?Object.fromEntries(['temperature_2m','apparent_temperature','relative_humidity_2m','wind_speed_10m','weather_code'].map(k=>[k,d?.hourly?.[k]?.[index]])):null;
 const hourStart=Math.max(0,index-1);
 const hours=times.slice(hourStart,hourStart+6);
 return <section className="card weather-card" aria-labelledby="track-weather-title">
  <header className="weather-heading">
   <h2 id="track-weather-title">赛道天气</h2>
   <div className="weather-view-controls">
    <select aria-label="天气预报场次" value={session?.id||''} onChange={e=>setChosen(e.target.value)}>
     {sessions.map(s=><option key={s.id} value={s.id}>{weatherSessionName(s)}</option>)}
    </select>
    <button className="icon-button weather-refresh" aria-label="更新天气" onClick={()=>setRetry(x=>x+1)} disabled={state.loading}><RefreshCw size={15}/></button>
   </div>
  </header>
  {state.error&&<p className="weather-message" role="status">{state.error}</p>}
  {state.loading?<p className="weather-message" role="status">正在加载天气…</p>:d&&<>
   {status!=='available'?<div className="weather-range-message"><Info size={20}/><div>
    <p className="weather-range-title">{status==='finished'?'所选场次已结束':status==='missing'?'比赛时间尚未确定':'尚未进入比赛天气预报范围'}</p>
   </div></div>:active&&<div className="weather-layout">
    <div className="weather-now">
     <div className="weather-current">
      <strong>{value(active.temperature_2m,'°')}</strong>
      {createElement(iconFor(active.weather_code),{size:35})}
      <div>{weatherText(active.weather_code)}<small>体感 {value(active.apparent_temperature,'°C')}</small></div>
     </div>
     <div className="weather-facts">
      <span><Wind size={14}/>{value(active.wind_speed_10m,' km/h')}</span>
      <span><Droplets size={14}/>{value(active.relative_humidity_2m,'%')}</span>
      <span>降水 {value(d.hourly.precipitation_probability?.[index],'%')}</span>
     </div>
    </div>
    <div className="weather-next">
     <div className="weather-hours" aria-label="比赛前后逐小时天气">
      {hours.map((t,i)=><div className={hourStart+i===index?'forecast-start':''} key={t}>
       <small>{new Date(t*1000).toLocaleTimeString('zh-CN',{timeZone:zone,hour:'2-digit',minute:'2-digit',hour12:false})}</small>
       {createElement(iconFor(d.hourly.weather_code?.[hourStart+i]),{size:16})}
       <b>{value(d.hourly.temperature_2m?.[hourStart+i],'°')}</b>
       <small className="rain-chance">{value(d.hourly.precipitation_probability?.[hourStart+i],'%')} 降水</small>
      </div>)}
     </div>
    </div>
   </div>}
  </>}
 </section>;
}
