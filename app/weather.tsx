'use client';
import {createElement,useEffect,useState} from 'react';
import {CloudSun,Sun,CloudRain,CloudFog,Snowflake,CloudLightning,Wind,Droplets,Flag,RefreshCw,Info} from 'lucide-react';
import {circuitLocations} from '../lib/circuit-locations';
import circuitExtra from '../lib/circuit-extra.json';
import {weatherRefreshMs,weatherHourIndex,weatherForecastStatus,weatherUrl,weatherSessionName,WeatherSession} from '../lib/weather';
type Row=Record<string,any>;
type SavedWeather={data:Row;fetchedAt:number};
const value=(n:unknown,unit='')=>typeof n==='number'&&Number.isFinite(n)?Math.round(n)+unit:'—';
const weatherText=(code:number)=>code===0?'晴':code<4?'多云':code<50?'雾':code<60?'毛毛雨':code<70?'雨':code<80?'雪':code<85?'阵雨':code<90?'阵雪':'雷暴';
const iconFor=(code:number)=>code===0?Sun:code>=95?CloudLightning:code>=71&&code<=77||code===85||code===86?Snowflake:code>=51?CloudRain:code>=40?CloudFog:CloudSun;
const date=(seconds:number,zone:string)=>new Date(seconds*1000).toLocaleString('zh-CN',{timeZone:zone,month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
export function WeatherCard({race,timezone:_timezone}:{race:Row;timezone:string}){
 const exact=(circuitExtra as Record<string,Row>)[race.circuit?.id];
 const coordinates=exact&&Number.isFinite(exact.latitude)&&Number.isFinite(exact.longitude)?[exact.latitude,exact.longitude]:circuitLocations[race.circuit?.nameKey];
 const key=coordinates?.join(',')||'',sessions=(race.schedule||[]) as WeatherSession[],sessionKey=JSON.stringify(sessions.map(s=>[s.id,s.startDate,s.endDate]));
 const [state,setState]=useState<{saved?:SavedWeather;error?:string;loading:boolean}>({loading:true}),[retry,setRetry]=useState(0),[mode,setMode]=useState<'race'|'now'>('race'),[chosen,setChosen]=useState(''),[now,setNow]=useState(Date.now());
 useEffect(()=>{setChosen('');setMode('race');},[race.id]);
 useEffect(()=>{
  const controller=new AbortController();let saved:SavedWeather|undefined,inFlight=false,lastFailure=0;
  try{const cached=JSON.parse(localStorage.getItem('paddock-weather-v2-'+key)||'null');if(cached?.data?.current&&Array.isArray(cached.data.hourly?.time)&&Number.isFinite(cached.fetchedAt))saved=cached;}catch{}
  setState({saved,loading:!saved});
  async function tick(force=false){
   const at=Date.now();setNow(at);if(document.hidden||inFlight||controller.signal.aborted)return;
   if(!navigator.onLine){setState({saved,loading:false,error:saved?'当前离线，显示上次获取的天气。':'当前离线，请联网后获取天气。'});return;}
   if(!key){setState({loading:false,error:'这条赛道的位置尚未收录。'});return;}
   if(!force&&(saved&&at-saved.fetchedAt<weatherRefreshMs(sessions,at)||at-lastFailure<60000))return;
   inFlight=true;if(!saved)setState({loading:true});
   try{
    const response=await fetch(weatherUrl(key),{signal:AbortSignal.any([controller.signal,AbortSignal.timeout(15000)])});
    if(!response.ok)throw Error('Weather HTTP '+response.status);
    const data=await response.json() as Row;if(!data.current||!Array.isArray(data.hourly?.time)||!Array.isArray(data.hourly?.temperature_2m))throw Error('Weather format');
    if(controller.signal.aborted)return;saved={data,fetchedAt:Date.now()};setState({saved,loading:false});
    try{localStorage.setItem('paddock-weather-v2-'+key,JSON.stringify(saved));}catch{}
   }catch{if(!controller.signal.aborted){lastFailure=Date.now();setState({saved,loading:false,error:saved?'更新暂未成功，正在显示上次获取的数据。':'天气暂时无法更新，请稍后重试。'});}}finally{inFlight=false;}
  }
  tick(retry>0);const timer=setInterval(()=>tick(),60000),resume=()=>{tick();};document.addEventListener('visibilitychange',resume);window.addEventListener('online',resume);
  return()=>{controller.abort();clearInterval(timer);document.removeEventListener('visibilitychange',resume);window.removeEventListener('online',resume);};
 },[key,sessionKey,retry]);
 const d=state.saved?.data,zone=typeof d?.timezone==='string'?d.timezone:'UTC';
 const main=sessions.find(s=>s.type==='MainRace')||sessions[0],session=sessions.find(s=>s.id===chosen)||main;
 const times:number[]=d?.hourly?.time||[],index=weatherHourIndex(times,session?Date.parse(session.startDate)/1000:NaN),status=weatherForecastStatus(session,times,now);
 const active=mode==='now'?d?.current:status==='available'?Object.fromEntries(['temperature_2m','apparent_temperature','relative_humidity_2m','wind_speed_10m','weather_code'].map(k=>[k,d?.hourly?.[k]?.[index]])):null;
 const hourStart=mode==='race'?Math.max(0,index-1):Math.max(0,weatherHourIndex(times,now/1000));
 const hours=times.slice(hourStart,hourStart+6),interval=weatherRefreshMs(sessions,now),intervalText=interval===300000?'场次前后 · 5 分钟刷新':interval===3600000?'临近比赛 · 每小时刷新':'平时 · 每 3 小时刷新';
 return <section className="card weather-card" aria-label="比赛地天气"><div className="panel-title"><div><p className="eyebrow">TRACKSIDE WEATHER</p><h2>赛道天气 <span>{race.circuit?.place}</span></h2></div><span className="weather-live"><i/>{intervalText}</span></div>
 <div className="weather-view-controls"><div className="segmented"><button className={mode==='race'?'selected':''} aria-pressed={mode==='race'} onClick={()=>setMode('race')}>比赛预报</button><button className={mode==='now'?'selected':''} aria-pressed={mode==='now'} onClick={()=>setMode('now')}>当地此刻</button></div>{mode==='race'&&<select aria-label="天气预报场次" value={session?.id||''} onChange={e=>setChosen(e.target.value)}>{sessions.map(s=><option key={s.id} value={s.id}>{weatherSessionName(s)}</option>)}</select>}<button className="icon-button weather-refresh" aria-label="更新天气" onClick={()=>setRetry(x=>x+1)} disabled={state.loading}><RefreshCw size={15}/></button></div>
 {state.error&&<p className="weather-message" role="status">{state.error}</p>}
 {state.loading?<p className="weather-message" role="status">正在获取赛道当地天气…</p>:d&&<>{mode==='race'&&<div className="weather-session"><Flag size={14}/><strong>{session?weatherSessionName(session):'比赛时间待公布'}</strong><span>{session?date(Date.parse(session.startDate)/1000,zone):''} · 赛道当地时间</span></div>}
 {mode==='race'&&status!=='available'?<div className="weather-range-message"><Info size={20}/><div><h3>{status==='finished'?'所选场次已结束':status==='missing'?'比赛时间尚未确定':'尚未进入比赛天气预报范围'}</h3><p>{status==='finished'?'不使用今天的天气冒充当年的比赛天气。可切换“当地此刻”，或选择未来比赛。':status==='missing'?'公布场次时间后，这里会匹配对应时段的预报。':'预报最多覆盖未来 16 天；进入覆盖范围后，这里会显示比赛时段预报。'}</p></div></div>:active&&<><div className="weather-layout"><div className="weather-now"><div className="weather-current"><strong>{value(active.temperature_2m,'°')}</strong>{createElement(iconFor(active.weather_code),{size:35})}<div>{weatherText(active.weather_code)}<small>体感 {value(active.apparent_temperature,'°C')}{mode==='race'?' · 发车时段':''}</small></div></div><div className="weather-facts"><span><Wind size={14}/>{value(active.wind_speed_10m,' km/h')}</span><span><Droplets size={14}/>{value(active.relative_humidity_2m,'%')}</span>{mode==='race'&&<span>降水 {value(d.hourly.precipitation_probability?.[index],'%')}</span>}</div></div><div className="weather-next"><p>{mode==='race'?'比赛前后六小时':'接下来六小时'}<small>{zone}</small></p><div className="weather-hours" aria-label="逐小时天气">{hours.map((t,i)=><div className={mode==='race'&&hourStart+i===index?'forecast-start':''} key={t}><small>{new Date(t*1000).toLocaleTimeString('zh-CN',{timeZone:zone,hour:'2-digit',minute:'2-digit',hour12:false})}</small>{createElement(iconFor(d.hourly.weather_code?.[hourStart+i]),{size:16})}<b>{value(d.hourly.temperature_2m?.[hourStart+i],'°')}</b><small className="rain-chance">{value(d.hourly.precipitation_probability?.[hourStart+i],'%')} 降水</small></div>)}</div></div></div>{mode==='now'&&<p className="section-note">当地天气有效时间：{date(d.current.time,zone)} · {zone}</p>}</>}
 <p className="weather-credit">Open-Meteo · CC BY 4.0 · 赛道周边气象模型，非现场传感器。{state.saved&&' 本次获取：'+date(state.saved.fetchedAt/1000,zone)+'（赛道当地时间）。'}</p></>}
 <details className="weather-update-guide"><summary>什么时候更新？需要电脑开着吗？</summary><p>不需要你的电脑开机。已发布网页由云端托管，你正在使用的手机／电脑直接向天气服务获取数据；APK 由手机获取。</p><p>页面打开、处于前台且联网时：场次开始前 30 分钟至结束后 30 分钟，每 5 分钟请求一次；距离下一场次 48 小时内每小时一次；其他时间每 3 小时一次。打开页面会先复用有效缓存，缓存过期才更新；手动刷新可立即请求。切后台或离线暂停请求，返回前台或恢复网络后按缓存是否过期补取。请求频率不代表上游模型会同频更新。</p><p>关闭页面不会继续在后台请求。Android 桌面小组件是独立功能，由手机系统在桌面更新、打开 App 或手动刷新时调度，可能受省电限制；它显示的是当地当前天气。</p></details></section>;
}
