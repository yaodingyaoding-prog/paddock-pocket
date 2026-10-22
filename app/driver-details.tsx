'use client';
import { useEffect, useState, type CSSProperties } from 'react';
import { CircleEllipsis, CalendarDays, Check, Flag, Globe2, Heart, LoaderCircle, Trophy, UserRound } from 'lucide-react';
import type { DriverArchive } from '../lib/drivers/contracts';
import { notesForDriver } from '../lib/drivers/notes';
import { canonicalTeam, type RaceLook, type RaceLookResult } from '../lib/race-media';
import { portraitFor } from '../lib/portrait';
import { NewsRoom } from './news';
import './driver-details.css';

type Row = Record<string, any>;
const count = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString('zh-CN') : '—';

export function WeekendLook({ driver, year, race }: { driver: Row; year: number; race?: Row }) {
  const [data,setData] = useState<RaceLookResult | null>(null), [loading,setLoading] = useState(false), [selected,setSelected] = useState(0), [failed,setFailed] = useState(false);
  const team = canonicalTeam(driver), raceId = race?.id, eligible = !!team && !!raceId && Number(race?.season?.year) === year;
  useEffect(() => {
    setData(null); setSelected(0); setFailed(false);
    if (!eligible) return;
    const abort = new AbortController(); setLoading(true);
    fetch('/api/race-media?' + new URLSearchParams({race:raceId,season:String(year),team:team!,driver:driver.isTeam ? '' : String(driver.tla || '')}), {signal:abort.signal}).then(async response => { if (!response.ok) throw new Error('unavailable'); setData(await response.json() as RaceLookResult); }).catch(() => { if (!abort.signal.aborted) setData(null); }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [raceId,year,team,driver.tla,driver.isTeam,eligible]);
  const item: RaceLook | undefined = data?.items[selected];
  return <section className="weekend-look"><div className="driver-section-heading"><div><p className="eyebrow">RACE WEEKEND LOOK</p><h3>{eligible ? race?.name + ' · 赛场造型' : year + ' 赛季赛车图片'}</h3></div><Flag size={18}/></div>{loading ? <div className="driver-media-empty" role="status"><LoaderCircle size={21}/>正在核对官方发布…</div> : item ? <><figure>{!failed ? <img src={'/api/race-media?image=' + encodeURIComponent(item.image)} alt={item.title} loading="lazy" onError={() => setFailed(true)}/> : <div className="driver-media-empty">图片暂时无法读取</div>}<figcaption><span>{item.verifiedDriver ? '车手图片已核对' : item.kind === 'suit' ? '车队赛车服发布图' : '车队涂装发布图'}</span><strong>{item.title}</strong></figcaption></figure>{data!.items.length > 1 && <div className="driver-media-switch">{data!.items.map((entry,index)=><button key={entry.image} aria-pressed={index === selected} onClick={()=>{setSelected(index);setFailed(false);}}>{entry.verifiedDriver ? '车手实车' : entry.kind === 'suit' ? '赛车服' : '车队涂装'}</button>)}</div>}<details className="driver-media-source"><summary>图片资料</summary><p>发布于 {item.publishedAt.slice(0,10)} · 对应 {year} 赛季{race?.name}</p><a href={item.source} target="_blank" rel="noopener noreferrer">官方发布记录<CircleEllipsis size={12}/></a></details></> : <div className="driver-media-empty"><Flag size={23}/><p>{eligible ? '暂未获取到已核实的本站特别涂装或赛车服图片。' : '该赛季对应的赛车图片暂未收录。'}</p><small>{eligible ? '后续打开此页面时会继续检查官方发布。' : '历史车队与车号见下方生涯档案。'}</small></div>}</section>;
}

export function DriverDetails({ driver, year, race, favorite, onFavorite }: { driver: Row; year: number; race?: Row; favorite: boolean; onFavorite: () => void }) {
  const [tab,setTab] = useState('overview'), [data,setData] = useState<{data:DriverArchive;updatedAt:string} | null>(null), [loading,setLoading] = useState(true), [error,setError] = useState(''), [retry,setRetry] = useState(0), [allSeasons,setAllSeasons] = useState(false), [portraitFailed,setPortraitFailed] = useState(false);
  const portrait = portraitFor(driver), note = notesForDriver(driver.driverName || '');
  useEffect(() => {
    const abort = new AbortController(); setLoading(true); setData(null); setError('');
    fetch('/api/drivers/' + encodeURIComponent(driver.driverId), {signal:abort.signal}).then(async response => {const value=await response.json() as {data:DriverArchive;updatedAt:string;error?:string};if(!response.ok||!value.data)throw new Error(value.error||'生涯资料暂时无法更新。');setData(value);}).catch(failure=>{if(!abort.signal.aborted)setError(failure instanceof Error?failure.message:'生涯资料暂时无法更新。');}).finally(()=>{if(!abort.signal.aborted)setLoading(false);});
    return ()=>abort.abort();
  },[driver.driverId,retry]);
  const profile = data?.data, career = profile?.career;
  const history = profile?.history || [], visibleHistory = allSeasons ? history : history.slice(0,6);
  const color = /^[a-f0-9]{6}$/i.test(driver.teamColor || '') ? '#' + driver.teamColor : 'var(--accent)';
  return <div className="driver-dossier" style={{'--driver-tint':color} as CSSProperties}>
    <div className="dossier-identity"><span className="dossier-portrait">{portrait && !portraitFailed ? <img src={portrait.file} alt={driver.driverName + '的头像'} onError={()=>setPortraitFailed(true)}/> : <UserRound size={42}/>}</span><div><span className="dossier-season">{year} 赛季 · {driver.teamShortName || driver.teamName}</span><h1>{driver.driverName}</h1><span className="dossier-tla">{driver.tla}</span></div><strong className="dossier-number" aria-label={'参赛车号' + (driver.number || '暂缺')}>{driver.number || '—'}</strong></div>
    <div className="dossier-season-stats"><div><span>赛季排名</span><strong>P{driver.position || '—'}</strong></div><div><span>赛季积分</span><strong>{count(driver.points)}</strong></div><div><span>赛季胜场</span><strong>{count(driver.wins)}</strong></div><button className={favorite?'is-following':''} aria-label={(favorite?'取消关注':'关注') + driver.driverName} onClick={onFavorite}>{favorite?<Check size={16}/>:<Heart size={16}/>}<span>{favorite?'已关注':'关注车手'}</span></button></div>
    <div className="driver-dossier-tabs" role="tablist" aria-label="车手资料分类">{[['overview','车手资料'],['career','生涯记录'],['news','相关动态']].map(([id,title])=><button key={id} role="tab" aria-selected={tab===id} tabIndex={tab===id?0:-1} onKeyDown={event=>{const ids=['overview','career','news'];let next=-1;if(event.key==='ArrowRight')next=(ids.indexOf(tab)+1)%3;if(event.key==='ArrowLeft')next=(ids.indexOf(tab)+2)%3;if(event.key==='Home')next=0;if(event.key==='End')next=2;if(next>=0){event.preventDefault();setTab(ids[next]);document.getElementById('driver-tab-'+ids[next])?.focus();}}} aria-controls={'driver-panel-'+id} id={'driver-tab-'+id} onClick={()=>setTab(id)}>{title}</button>)}</div>
    <div key={tab} className="driver-tab-panel" role="tabpanel" tabIndex={0} id={'driver-panel-'+tab} aria-labelledby={'driver-tab-'+tab}>
      {tab !== 'news' && loading && <p className="driver-data-loading" role="status"><LoaderCircle size={16}/>正在读取生涯资料…</p>}
      {tab !== 'news' && error && <div className="driver-archive-error" role="status"><span>{error}</span><button onClick={()=>setRetry(retry+1)}>重试</button></div>}
      {tab === 'overview' && <div className="driver-overview-grid"><div className="driver-overview-main"><div className="driver-facts">{profile?.country&&<span><Globe2 size={16}/><strong>{profile.country}</strong><small>国籍</small></span>}{profile?.birthday&&<span><CalendarDays size={16}/><strong>{profile.birthday}</strong><small>出生日期</small></span>}{history.length>0&&<span><Flag size={16}/><strong>{Math.min(...history.map(item=>item.year))}</strong><small>最早赛季记录</small></span>}</div>{note&&<section className="driver-biography"><div className="driver-aliases">{note.aliases.map(alias=><span key={alias}>{alias}</span>)}</div><p>{note.note}</p>{note.numberHistory&&<p className="driver-number-history"><strong>车号沿革</strong>{note.numberHistory}</p>}<a href={note.source} target="_blank" rel="noopener noreferrer">称呼与资料出处<CircleEllipsis size={12}/></a></section>}{career&&<section className="driver-career-preview"><h3><Trophy size={17}/>生涯成就</h3><div className="driver-career-stats">{[['世界冠军',career.titles],['分站冠军',career.wins],['领奖台',career.podiums]].map(([name,value])=><div key={name}><strong>{count(value)}</strong><span>{name}</span></div>)}</div></section>}</div></div>}
      {tab === 'career' && profile&&<><div className="driver-career-stats all-career-stats">{[['世界冠军',career?.titles],['分站冠军',career?.wins],['领奖台',career?.podiums],['杆位',career?.poles],['正赛记录',career?.starts]].map(([name,value])=><div key={name}><strong>{count(value)}</strong><span>{name}</span></div>)}</div>{profile.championshipYears.length>0&&<div className="driver-title-years"><Trophy size={17}/><span>已核实冠军赛季<strong>{profile.championshipYears.join(' · ')}</strong></span></div>}<div className="driver-section-heading"><h3>历年赛季与车队</h3><small>{history.length} 条记录</small></div><div className="driver-history-list">{visibleHistory.map((entry,index)=><div key={entry.year+'-'+entry.team+'-'+index}><strong>{entry.year}</strong><span><b>{entry.team}</b><small>{entry.number ? '#'+entry.number : '车号暂无记录'}</small></span><span>{entry.position?'P'+entry.position:'—'}<small>{entry.points==null?'—':entry.points+' 分'}</small></span></div>)}</div>{history.length>6&&<button className="driver-history-more" onClick={()=>setAllSeasons(!allSeasons)}>{allSeasons?'收起赛季':'展开全部赛季'}</button>}<p className="driver-stat-note">生涯累计数据与上方所选赛季分开统计。更新于 {data?.updatedAt.slice(0,10)}。</p></>}
      {tab === 'news'&&<NewsRoom compact tla={driver.tla} team={driver.teamShortName}/>}
    </div>
  </div>;
}
