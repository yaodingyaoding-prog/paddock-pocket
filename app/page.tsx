'use client';


import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Trophy, LayoutGrid, Compass, UserRound, ChevronRight, ArrowUpRight, RefreshCw, Flag, MapPin, Clock3, Star, Check, Download, WifiOff, Bell, ArrowLeft } from 'lucide-react';
import { snapshotDate, snapshotSeason } from '../lib/snapshot-meta';
import { useAccountControls } from './account-controls';
import { ProfilePage } from './profile';
import { resultLabel } from '../lib/result-label';
import { WeatherCard, WatchGuide, ViewingRoom, ClassicRaces } from './extensions';
import { Championship } from './championship';
import { CircuitArchive, CircuitImage } from './circuit';
import { NewsRoom } from './news';
import {ToolsHub} from './tools-hub';
import {Dialog} from './dialog';
import {portraitFor} from '../lib/portrait';
import {ReplayLibrary} from './race-replays';
import {usePaddockNavigation,detailPages,QuickActions,DiscoverOverview,SectionLink} from './paddock-navigation';

type Row = Record<string, any>;
type Envelope = { data: any; source: string; updatedAt: string };
const icons = { schedule: CalendarDays, rankings: Trophy, widgets: LayoutGrid, discover: Compass, profile: UserRound };
const labels = { schedule: '赛程', rankings: '积分', widgets: '速览', discover: '探索', profile: '我的' };
type Tab = keyof typeof labels;
const navs = Object.keys(labels) as Tab[];
const safeGet = (key: string, fallback: any) => { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } };
const stamp = (date: string) => new Date(date).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai' });
const number = (value: any) => value == null ? '—' : String(value);
const teamFile = (r: Row) => ({ mercedes: 'mercedes', ferrari: 'ferrari', mclaren: 'mclaren', 'red bull racing': 'redbullracing', redbull: 'redbullracing', alpine: 'alpine', 'aston martin': 'astonmartin', 'racing bulls': 'racingbulls', haas: 'haas', williams: 'williams', audi: 'audi', cadillac: 'cadillac' }[String(r.teamShortName || r.teamName || '').toLowerCase()] || 'mercedes');
const color = (r: Row) => /^[a-f0-9]{6}$/i.test(r.teamColor || '') ? `#${r.teamColor}` : '#28dfc0';
const sessionName = (s: Row) => (({ FirstPractice: '第一次自由练习赛', SecondPractice: '第二次自由练习赛', ThirdPractice: '第三次自由练习赛', StandardQualifying: '排位赛', SprintQualifying: '冲刺排位赛', SprintRace: '冲刺赛', MainRace: '正赛' } as Record<string,string>)[s.type] || s.sessionName || '比赛');
const kind = (s: Row) => /Practice/.test(s.type) ? 'practices' : /Qualifying/.test(s.type) ? 'qualifying' : 'races';
const dateParts = (date: string, tz: string, options: Intl.DateTimeFormatOptions) => new Date(date).toLocaleString('zh-CN', { timeZone: tz, ...options });
async function fetchData(resource: string, season: string, extra: Record<string, string> = {}): Promise<Envelope> {
  const response = await fetch('/api/data?' + new URLSearchParams({ resource, season, ...extra }));
  const json = await response.json() as Envelope & { error?: string };
  if (!response.ok || json.error) throw new Error(json.error || '数据暂不可用');
  return json;
}
function DriverPortrait({driver}:{driver:Row}) {
  const portrait=portraitFor(driver),[failed,setFailed]=useState(false);
  useEffect(()=>setFailed(false),[portrait?.file]);
  return <span className={'driver-portrait '+(portrait?.historical?'historical-portrait':'')}>{portrait&&!failed?<img src={portrait.file} alt={driver.driverName+'的头像'} loading="lazy" onError={()=>setFailed(true)}/>:<UserRound aria-label="头像暂缺"/>}</span>;
}
function Countdown({ date, now }: { date?: string; now: number }) {
  const remaining = date && now ? Math.max(0, new Date(date).getTime() - now) : 0;
  const values = [Math.floor(remaining / 86400000), Math.floor(remaining / 3600000) % 24, Math.floor(remaining / 60000) % 60, Math.floor(remaining / 1000) % 60];
  return <div className="countdown" aria-label="开赛倒计时">{values.map((v, i) => <div key={i}><strong>{now ? String(v).padStart(2, '0') : '—'}</strong><span>{['天', '小时', '分钟', '秒'][i]}</span></div>)}</div>;
}
function PanelTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return <div className="panel-title"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2></div>{children}</div>;
}
export default function App() {
  const {tab,detail,setTab,openDetail}=usePaddockNavigation();
  const account = useAccountControls();
  const detailInfo=detail?detailPages[detail]:null;
  const [season, setSeason] = useState(snapshotSeason);
  const [data, setData] = useState<Record<string, any>>({});
  const [meta, setMeta] = useState<Envelope>({ data: null, source: 'snapshot', updatedAt: snapshotDate });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Row | null>(null);
  const [raceList, setRaceList] = useState(false);
  const [replayRaceId,setReplayRaceId]=useState('');
  const openRaceReplay=(id:string)=>{setReplayRaceId(id);openDetail('replays');};
  const [rankType, setRankType] = useState('drivers');
  const [now, setNow] = useState(0);
  const [timezone, setTimezone] = useState('Asia/Shanghai');
  const [localTimezone, setLocalTimezone] = useState('Asia/Shanghai');
  const [favorite, setFavorite] = useState('');
  const [theme, setTheme] = useState('dark');
  const [accent,setAccent]=useState('mint');
  const [driver, setDriver] = useState<Row | null>(null);
  const [results, setResults] = useState<{ session: Row; race: Row; loading: boolean; rows?: Row[]; error?: string } | null>(null);
  const [toast, setToast] = useState('');
  const [install, setInstall] = useState(false);
  const raceRef = useRef(0);
  const resultRef = useRef(0);
  const activeSeason = data.seasons?.items?.find((s: Row) => s.id === season);
  const year = activeSeason?.year || 2026;
  const races: Row[] = data.races?.items || [];
  const race = selected || data.next || races[0];
  const sessions: Row[] = [...(race?.schedule || [])].sort((a, b) => +new Date(a.startDate) - +new Date(b.startDate));
  const nextSession = sessions.find(s => +new Date(s.startDate) > now);
  const drivers: Row[] = data.drivers?.items?.[0]?.standings || [];
  const teams: Row[] = data.teams?.items?.[0]?.standings || [];
  const favoriteDriver = drivers.find(d => d.driverId === favorite);


  useEffect(() => {
    window.dispatchEvent(new Event('paddock:ready'));
    setNow(Date.now());
    setLocalTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    setTimezone(safeGet('paddock-timezone', 'Asia/Shanghai'));
    setFavorite(safeGet('paddock-favorite', ''));
    setTheme(safeGet('paddock-theme', 'dark'));
    setAccent(safeGet('paddock-accent','mint'));
    const cached = safeGet('paddock-cache', null);
    if (cached?.season === snapshotSeason && cached.data?.next && cached.data?.races) { setData(cached.data); setMeta(cached.meta); }
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => { document.documentElement.dataset.accent = accent; }, [accent]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 3500); return () => clearTimeout(t); }, [toast]);
  useEffect(() => { load(season); const id=setInterval(()=>{if(document.visibilityState==='visible')load(season);},300000); return ()=>clearInterval(id); }, [season]);

  async function load(seasonId: string) {
    const version = ++raceRef.current;
    setBusy(true); setError('');
    const names = ['seasons', 'races', 'drivers', 'teams', ...(seasonId === snapshotSeason ? ['next'] : [])];
    const responses = await Promise.allSettled(names.map(name => fetchData(name, seasonId)));
    if (version !== raceRef.current) return;
    const nextData: Record<string, any> = {}; const successful: Envelope[] = [];
    responses.forEach((result, i) => { if (result.status === 'fulfilled') { nextData[names[i]] = result.value.data; successful.push(result.value); } });
    if (successful.length) {
      if (seasonId !== snapshotSeason) nextData.next = nextData.races?.items?.find((r: Row) => r.status === 'Scheduled') || nextData.races?.items?.at(-1);
      const merged = { ...data, ...nextData };
      const info = successful.find(r => r.source === 'snapshot') || successful[0];
      setData(merged); setMeta(info);
      try { localStorage.setItem('paddock-cache', JSON.stringify({ season: seasonId, data: merged, meta: { ...info, data: null } })); } catch { /* Private mode / storage quota: browsing still works. */ }
    }
    if (responses.some(r => r.status === 'rejected')) setError('部分数据未能更新，可以稍后重试。');
    setBusy(false);
  }
  function changeSeason(value: string) { setSeason(value); setSelected(null); setData({ seasons: data.seasons }); setError(''); }
  function savePreference(key: string, value: string) { try { localStorage.setItem('paddock-' + key, JSON.stringify(value)); } catch {} }
  function pickFavorite(d: Row) { const value = favorite === d.driverId ? '' : d.driverId; setFavorite(value); savePreference('favorite', value); setToast(value ? `已关注${d.driverName}` : '已取消关注'); }
  async function viewResults(s: Row, r = race) {
    if (!r) return;
    const version = ++resultRef.current;
    if (+new Date(s.startDate) > Date.now()) { setResults({ session: s, race: r, loading: false, rows: [] }); return; }
    setResults({ session: s, race: r, loading: true });
    try { const response = await fetchData('results', season, { gp: r.id, session: s.id, kind: kind(s) }); if (version === resultRef.current) setResults({ session: s, race: r, loading: false, rows: response.data.participations || [] }); }
    catch { if (version === resultRef.current) setResults({ session: s, race: r, loading: false, error: '这场比赛的成绩暂时无法读取。请稍后重试。' }); }
  }
  function calendar(s: Row) {
    if (!race) return;
    const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    const utc = (s: string) => new Date(s).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//My Paddock//Race Calendar//ZH','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:${s.id}@my-paddock`,`DTSTAMP:${utc(new Date().toISOString())}`,`DTSTART:${utc(s.startDate)}`,`DTEND:${utc(s.endDate || new Date(+new Date(s.startDate) + 3600000).toISOString())}`,`SUMMARY:${esc(race.name + ' · ' + sessionName(s))}`,`LOCATION:${esc(race.circuit?.name || '')}`,'BEGIN:VALARM','TRIGGER:-PT30M','ACTION:DISPLAY','DESCRIPTION:比赛即将开始','END:VALARM','END:VEVENT','END:VCALENDAR'];
    const url = URL.createObjectURL(new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/calendar;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `F1-${s.sessionShortName}.ics`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
    setToast('已生成日历文件，请在系统日历中确认添加');
  }
  const seasonSelect = <label className="season-select"><span className="sr-only">选择赛季</span><select aria-label="选择赛季" value={season} onChange={e => changeSeason(e.target.value)}>{(data.seasons?.items || []).map((s: Row) => <option key={s.id} value={s.id}>{s.year} 赛季</option>)}</select></label>;
  const dateGroups = sessions.reduce<Record<string, Row[]>>((groups, s) => { const key = dateParts(s.startDate, timezone, { month: 'long', day: 'numeric', weekday: 'short' }); (groups[key] ||= []).push(s); return groups; }, {});

  return <div className="app-shell" data-section={detailInfo?.tone || (tab==='rankings'?'gold':'mint')}>
    <aside className="desktop-rail"><a className="brand" href="#" onClick={e => { e.preventDefault(); setTab('schedule'); }}><img src="/favicon.svg" alt=""/><span>围场口袋<small>F1 赛事与数据</small></span></a><p className="rail-label">PADDOCK POCKET</p><nav aria-label="主导航">{navs.map(t => { const Icon = icons[t]; return <button className={tab === t ? 'active' : ''} key={t} onClick={() => setTab(t)}><Icon size={20}/>{labels[t]}<ChevronRight size={15}/></button>; })}</nav><div className="rail-bottom"><Flag size={17}/><span>PADDOCK POCKET<br/><b>F1 赛事与数据</b></span></div></aside>
    <div className="workspace"><header className="topbar"><div className="mobile-brand"><img src="/favicon.svg" alt=""/><span>围场口袋</span><small>F1</small></div><div className="desktop-breadcrumb">围场口袋 <ChevronRight size={14}/> {labels[tab]}{detailInfo&&<><ChevronRight size={14}/>{detailInfo.title}</>}</div><div className="header-tools"><span className="season-tag">{year} SEASON</span><button aria-label="刷新数据" className={'icon-button ' + (busy ? 'spinning' : '')} onClick={() => load(season)} disabled={busy}><RefreshCw size={18}/></button></div></header>
      <main id="main" className={"main-content "+(detail?'detail-page':'')+(tab==='profile'?' profile-main':'')}>{detail&&<button className="text-button tool-back subpage-back" onClick={()=>setTab(tab)}><ArrowLeft size={16}/>返回{labels[tab]}</button>}<div className="page-heading"><div><p className="eyebrow">{detailInfo?.en || (tab === 'schedule' ? 'RACE WEEKEND' : tab === 'rankings' ? 'THE CHAMPIONSHIP' : tab === 'widgets' ? 'AT A GLANCE' : tab === 'discover' ? 'BEYOND THE GRID' : 'YOUR OWN PADDOCK')}</p><h1>{detailInfo?.title || (tab === 'schedule' ? '赛程' : tab === 'rankings' ? '积分榜' : tab === 'widgets' ? '赛事速览' : tab === 'discover' ? '探索' : '我的围场')}</h1></div>{(['schedule','rankings'].includes(tab)||detail==='replays') && seasonSelect}</div>
      {error && <div role="status" className="notice"><WifiOff size={16}/>{error}<button onClick={() => load(season)}>重试</button></div>}

      {detail&&<div className={'detail-workspace tone-'+detailInfo?.tone} key={detail}>{detail==='viewing'?<ViewingRoom onReplay={()=>openDetail('replays')}/>:detail==='replays'?<ReplayLibrary races={races} year={year} focusedRaceId={replayRaceId} loading={busy&&!races.length}/>:detail==='news'?<NewsRoom/>:detail==='classics'?<ClassicRaces/>:detail==='circuit'?(race?<><div className="archive-preview"><CircuitImage circuit={race.circuit}/><div><p className="eyebrow">ROUND {race.round} / {year}</p><h2>{race.name}</h2><p>{race.circuit?.place}</p></div></div><CircuitArchive race={race}/></>:<p className="empty">请先选择一场比赛。</p>):detail==='championship'?<Championship drivers={drivers} races={races} updatedAt={meta.updatedAt} source={meta.source} year={year}/>:<ToolsHub seasons={data.seasons?.items||[]} page={detail}/>}</div>}
      {tab === 'schedule' && !detail && <>
        <div className="schedule-toolbar"><div className="segmented"><button className={!raceList ? 'selected' : ''} onClick={() => setRaceList(false)}>比赛周末</button><button className={raceList ? 'selected' : ''} onClick={() => setRaceList(true)}>完整赛历 <span>{races.length || '—'}</span></button></div>{selected && <button className="text-button" onClick={() => {setSelected(null);setRaceList(false);}}>返回下一站 <ArrowUpRight size={15}/></button>}</div>
        {raceList ? <section className="calendar-grid" aria-label="完整赛历">{races.length ? races.map(r => <button key={r.id} className={'race-tile ' + (r.id === race?.id ? 'chosen' : '')} onClick={() => {setSelected(r);setRaceList(false);}}><span className="round">ROUND {String(r.round).padStart(2,'0')}</span><span className={'status-pill ' + (r.status === 'Finished' ? 'muted' : '')}>{r.status === 'Finished' ? '已完赛' : '待发车'}</span><h3>{r.name}</h3><p>{r.circuit?.place || r.circuit?.name}</p><div><span>{dateParts(r.startDate, timezone, {month:'2-digit',day:'2-digit'})} — {dateParts(r.endDate, timezone, {month:'2-digit',day:'2-digit'})}</span><ChevronRight size={19}/></div></button>) : <div className="empty">{busy ? '正在载入赛历…' : '这个赛季暂时没有赛历数据。'}</div>}</section> : race ? <div className="weekend-dashboard">
          <div className="weekend-top-grid"><section className="hero-race"><div className="hero-stripe"/><div className="race-meta"><span className="eyebrow">ROUND {String(race.round).padStart(2,'0')} / {year}</span><span className="status-pill"><i/>{race.status === 'Finished' ? '比赛回顾' : '下一站'}</span></div><div className="hero-title-row"><div><p className="race-english">{race.nameKey || race.officialName}</p><h2>{race.name}</h2><p className="circuit-label"><MapPin size={16}/>{race.circuit?.name} · {race.circuit?.place}</p></div><CircuitImage circuit={race.circuit}/></div><div className="race-date"><CalendarDays size={17}/>{dateParts(race.startDate, timezone, {month:'long',day:'numeric'})} — {dateParts(race.endDate, timezone, {month:'long',day:'numeric'})}</div><div className="countdown-panel"><div className="countdown-label"><span><Clock3 size={14}/>{nextSession ? '距离' + sessionName(nextSession) : race.status === 'Finished' ? '比赛周末已结束' : '本周末暂无后续场次'}</span><span className="live-dot">{nextSession ? '倒计时' : 'FINISHED'}</span></div>{nextSession && <Countdown date={nextSession.startDate} now={now}/>}</div></section><QuickActions onOpen={openDetail}/></div>
          <div className="weather-slot"><WeatherCard race={race} timezone={timezone}/></div><div className="weekend-detail-grid"><section className="schedule-section"><PanelTitle title="赛事时间安排" eyebrow="THE WEEKEND"><label className="zone-select"><Clock3 size={13}/><select aria-label="时间显示方式" value={timezone} onChange={e => {setTimezone(e.target.value);savePreference('timezone',e.target.value);}}><option value="Asia/Shanghai">北京时间</option><option value={localTimezone}>设备时间</option><option value="UTC">UTC 时间</option></select></label></PanelTitle>{Object.entries(dateGroups).map(([day, items]) => <div className="day-group" key={day}><h3>{day}</h3>{items.map(s => <div className={'session-row ' + (s.id === nextSession?.id ? 'up-next' : '')} key={s.id}><button className="session-main" onClick={() => viewResults(s)}><span className={'session-mark ' + (/Race/.test(s.type) ? 'race' : /Qualifying/.test(s.type) ? 'quali' : '')}>{s.sessionShortName}</span><div><strong>{sessionName(s)}</strong><span>{+new Date(s.startDate) > now ? '即将开始' : +new Date(s.endDate) > now ? '场次进行中' : '查看比赛成绩'}</span></div><time>{dateParts(s.startDate, timezone, {hour:'2-digit',minute:'2-digit',hour12:false})}</time></button><button className="calendar-button" aria-label={'添加' + sessionName(s) + '到日历'} onClick={() => calendar(s)}><Bell size={17}/></button></div>)}</div>)}</section>
        <aside className="weekend-secondary"><section className="card circuit-brief tone-mint"><div className="panel-title"><div><p className="eyebrow">KNOW THE CIRCUIT</p><h2>赛道概览</h2></div><Flag size={20}/></div><h3>{race.circuit?.name}</h3><div className="circuit-brief-stats"><div><strong>{race.trackLength || (race.circuit?.trackSize?race.circuit.trackSize/1000:'—')}<small> km</small></strong><span>单圈长度</span></div><div><strong>{race.scheduledLaps || '—'}<small> 圈</small></strong><span>正赛圈数</span></div></div><SectionLink id="circuit" onOpen={openDetail} compact/></section>
          <section className="card"><PanelTitle title="本站轮胎" eyebrow="ON THE RUBBER"/><div className="tyres">{(race.tyreSet?.tyres || []).filter((t: Row) => !t.isWet).map((t: Row) => <div key={t.type}><span className={'tyre ' + t.type.toLowerCase()}>{t.compound || t.type[0]}</span><small>{({Hard:'硬胎',Medium:'中性胎',Soft:'软胎'} as Record<string,string>)[t.type] || t.type}</small></div>)}</div>{!race.tyreSet?.tyres?.length && <p className="muted-text">轮胎配方尚未公布</p>}</section>
          <section className="card replay-weekend-card"><p className="eyebrow">RACE REPLAYS</p><h3>本站回放</h3><p>正赛、排位赛与练习赛</p><button className="text-button" onClick={()=>openRaceReplay(race.id)}>查看回放 <ArrowUpRight size={16}/></button></section><section className="card follow-card"><Star size={20}/><h3>{favoriteDriver ? favoriteDriver.driverName : '关注车手'}</h3><p>{favoriteDriver ? `${favoriteDriver.teamName} · 当前第 ${favoriteDriver.position} 名 · ${favoriteDriver.points} 分` : '关注后查看积分与赛季表现。'}</p><button className="text-button" onClick={() => setTab('rankings')}>{favoriteDriver ? '查看积分榜' : '选一位车手'}<ArrowUpRight size={16}/></button></section></aside></div></div> : <div className="empty">{busy ? '正在准备比赛周末…' : '这个赛季暂时没有可显示的赛事。'}</div>}
      </>}
      {tab === 'rankings' && !detail && <><div className="ranking-spotlight"><div><p className="eyebrow">THE TITLE EQUATION</p><h2>争冠分析</h2></div><SectionLink id="championship" onOpen={openDetail} compact/></div><div className="rank-toolbar"><div className="segmented"><button className={rankType === 'drivers' ? 'selected' : ''} onClick={() => setRankType('drivers')}>车手积分榜</button><button className={rankType === 'teams' ? 'selected' : ''} onClick={() => setRankType('teams')}>车队积分榜</button></div><span className="muted-text">{rankType === 'drivers' ? drivers.length + ' 位车手' : teams.length + ' 支车队'}</span></div><div className="rank-list">{(rankType === 'drivers' ? drivers : teams).map((r, i) => <div key={r.driverId || r.teamId} className={'rank-row position-' + r.position} style={{'--team-color':color(r)} as React.CSSProperties}><span className="position">{r.position}</span>{rankType === 'drivers' ? <button className="rank-person" onClick={() => setDriver(r)}><DriverPortrait driver={r}/><span><strong>{r.driverName}</strong><small><i style={{background:color(r)}}/>{r.teamName || r.teamShortName}<em>#{r.number}</em></small></span></button> : <button className="rank-person" onClick={() => setDriver({...r,isTeam:true})}><img className="rank-car" src={'/cars/'+teamFile(r)+'.png'} alt=""/><span><strong>{r.teamName || r.teamShortName}</strong><small>{r.teamShortName}</small></span></button>}<div className="rank-points"><strong>{r.points}</strong><span>{i ? '距榜首 ' + ((rankType === 'drivers' ? drivers : teams)[0].points-r.points) : '领跑积分榜'}</span></div>{rankType === 'drivers' && <button className={'favorite-button ' + (favorite === r.driverId ? 'picked' : '')} aria-label={(favorite === r.driverId ? '取消关注' : '关注') + r.driverName} onClick={() => pickFavorite(r)}><Star size={18} fill={favorite === r.driverId ? 'currentColor' : 'none'}/></button>}</div>)}</div>{!(rankType === 'drivers' ? drivers : teams).length && <div className="empty">{busy ? '正在加载积分榜…' : '该赛季暂无积分数据。'}</div>}</>}
      {tab === 'widgets' && <><div className="widget-grid"><section className="card widget-race"><span className="eyebrow">NEXT RACE</span><h2>{data.next?.name || '下一场比赛'}</h2><p>{data.next?.circuit?.place}</p><Flag className="widget-watermark"/><Countdown now={now} date={data.next?.schedule?.find((s:Row) => s.type === 'MainRace')?.startDate}/><span className="widget-label">距离正赛发车</span></section><section className="card driver-widget"><Star size={22}/><span className="eyebrow">MY DRIVER</span><h2>{favoriteDriver?.driverName || '选择你的车手'}</h2><p>{favoriteDriver?.teamName || '关注一位车手，随时查看赛季表现。'}</p>{favoriteDriver && <div className="widget-score"><strong>{favoriteDriver.points}<small>积分</small></strong><strong>P{favoriteDriver.position}<small>赛季排名</small></strong></div>}<button className="text-button" onClick={() => setTab('rankings')}>{favoriteDriver ? '更换关注' : '去积分榜选择'}<ChevronRight size={16}/></button></section></div><WatchGuide/><div className="install-card"><Download size={24}/><div><h3>添加到主屏幕</h3><p>从浏览器快速打开围场口袋。</p></div><button className="small-button" onClick={() => setInstall(true)}>查看步骤</button></div></>}
      {tab === 'discover' && !detail && <DiscoverOverview onOpen={openDetail}/>}
      {tab === 'profile' && <ProfilePage account={account} theme={theme} accent={accent} timezone={timezone} localTimezone={localTimezone} drivers={drivers} favoriteDriver={favoriteDriver} loadingDrivers={busy && !drivers.length} onTheme={value=>{setTheme(value);savePreference('theme',value);}} onAccent={value=>{setAccent(value);savePreference('accent',value);}} onTimezone={value=>{setTimezone(value);savePreference('timezone',value);}} onPickDriver={pickFavorite} onOpenDriver={setDriver} onReplay={()=>openDetail('replays')} onViewing={()=>openDetail('viewing')} onWidgets={()=>setTab('widgets')} onInstall={()=>setInstall(true)}/>}
      <footer className="data-footer"><span><i className={meta.source === 'live' ? 'online' : ''}/>{busy ? '正在更新…' : meta.source === 'live' ? '在线数据' : '最近保存'} · {stamp(meta.updatedAt)}</span><span>PADDOCK POCKET</span></footer>
      </main></div>
    <nav className="bottom-nav" aria-label="底部导航">{navs.map(t => { const Icon = icons[t]; return <button key={t} className={tab === t ? 'active' : ''} aria-current={tab === t ? 'page' : undefined} onClick={() => {setTab(t);window.scrollTo({top:0});}}><Icon size={22}/><span>{labels[t]}</span></button>; })}</nav>
    {toast && <div className="toast" role="status"><Check size={17}/>{toast}</div>}
    {driver && <Dialog title={driver.isTeam ? driver.teamName : driver.driverName} close={() => setDriver(null)}><div className="driver-detail" style={{'--team-color':color(driver)} as React.CSSProperties}>{!driver.isTeam && <DriverPortrait driver={driver}/>}<img src={'/cars/'+teamFile(driver)+'.png'} alt="车队赛车"/><p>{driver.teamName} {driver.tla ? `· ${driver.tla} #${driver.number}` : ''}</p><div className="detail-stats"><div><span>赛季排名</span><strong>P{driver.position}</strong></div><div><span>积分</span><strong>{driver.points}</strong></div>{!driver.isTeam && <div><span>分站冠军</span><strong>{number(driver.wins)}</strong></div>}</div>{!driver.isTeam && <button className="primary-button" onClick={() => pickFavorite(driver)}><Star size={17}/>{favorite === driver.driverId ? '已关注 · 点击取消' : '关注这位车手'}</button>}</div><NewsRoom compact tla={driver.isTeam?undefined:driver.tla} team={driver.teamShortName}/></Dialog>}
    {results && <Dialog title={sessionName(results.session)} close={() => {resultRef.current++;setResults(null);}}><p className="result-subtitle">{results.race.name} · {dateParts(results.session.startDate,timezone,{month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'})}</p>{results.loading ? <div className="empty">正在读取比赛成绩…</div> : results.error ? <div className="empty"><WifiOff size={30}/><p>{results.error}</p><button className="small-button" onClick={() => viewResults(results.session,results.race)}>重试</button></div> : !results.rows?.length ? <div className="empty">{+new Date(results.session.startDate) > now ? '比赛尚未开始，成绩将在结束后公布。' : '暂时没有这场比赛的成绩。'}</div> : <div className="results-table"><div className="results-heading"><span>名次 / 车手</span><span>成绩</span></div>{[...results.rows].sort((a,b) => (a.result?.position || a.position || 999)-(b.result?.position || b.position || 999)).map((p,i) => <div className="result-row" key={p.driverId || i}><b>{p.result?.position || p.position || '—'}</b><span><strong>{p.driverName || p.driverTla}</strong><small>{p.teamName || p.driverTla}</small></span><time>{resultLabel(p)}</time></div>)}</div>}</Dialog>}
    {install && <Dialog title="把围场添加到主屏幕" close={() => setInstall(false)}><div className="install-instructions"><img src="/favicon.svg" alt="围场图标"/><h3>添加围场口袋</h3><ol><li>在 iPhone 的 Safari 中打开本站。</li><li>点击浏览器的“分享”按钮。</li><li>选择“添加到主屏幕”，再点击“添加”。</li></ol><p>如果当前在其他 App 内打开，请先选择“在 Safari 中打开”。</p></div></Dialog>}
  </div>;
}
