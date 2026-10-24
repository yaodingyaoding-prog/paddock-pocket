'use client';


import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { CalendarDays, Trophy, Heart, ChevronDown, Info, Compass, UserRound, CircleEllipsis, ContactRound, Dot, RefreshCw, Flag, MapPin, Clock3, Star, Check, Download, WifiOff, Bell, ArrowLeft, Share2 } from 'lucide-react';
import { snapshotDate, snapshotSeason } from '../lib/snapshot-meta';
import { useAccountControls } from './account-controls';
import { useAccountPreferences } from './account-preferences';
import { RaceHero } from './race-hero';
import { pruneClientCache } from '../lib/client-cache';
import { GlassNavigation } from './glass-navigation';
import './ui-refinement.css';
import './race-design.css';
import './interaction-polish.css';
import { toggleFollowing } from '../lib/following';
import type { PreferencesPatch } from '../lib/preferences';
import { followTeamKey } from './following';
import { canonicalTeam } from '../lib/race-media';
import { TimezonePicker } from './timezone-picker';
import { resultLabel } from '../lib/result-label';
import { WeatherCard } from './weather';
import { CircuitImage } from './circuit';
import {Dialog} from './dialog';
import {portraitFor} from '../lib/portrait';
import { weekendShareCard, podiumShareCard, readSharedSelection, shareWeather, type ShareCard } from '../lib/share-card';
import { circuitLocations } from '../lib/circuit-locations';
import circuitExtra from '../lib/circuit-extra.json';
import {usePaddockNavigation,detailPages,DiscoverOverview,SectionLink} from './paddock-navigation';

const ProfilePage=lazy(()=>import('./profile').then(module=>({default:module.ProfilePage})));
const DriverDetails=lazy(()=>import('./driver-details').then(module=>({default:module.DriverDetails})));
const WeekendLook=lazy(()=>import('./driver-details').then(module=>({default:module.WeekendLook})));
const TeamCarStage=lazy(()=>import('./team-car').then(module=>({default:module.TeamCarStage})));
const WatchGuide=lazy(()=>import('./extensions').then(module=>({default:module.WatchGuide})));
const ViewingRoom=lazy(()=>import('./viewing-room').then(module=>({default:module.ViewingRoom})));
const ClassicRaces=lazy(()=>import('./extensions').then(module=>({default:module.ClassicRaces})));
const Championship=lazy(()=>import('./championship').then(module=>({default:module.Championship})));
const CircuitArchive=lazy(()=>import('./circuit').then(module=>({default:module.CircuitArchive})));
const NewsRoom=lazy(()=>import('./news').then(module=>({default:module.NewsRoom})));
const ToolsHub=lazy(()=>import('./tools-hub').then(module=>({default:module.ToolsHub})));
const SharePosterDialog=lazy(()=>import('./share-poster-dialog').then(module=>({default:module.SharePosterDialog})));
const ReplayLibrary=lazy(()=>import('./race-replays').then(module=>({default:module.ReplayLibrary})));

type Row = Record<string, any>;
type Envelope = { data: any; source: string; updatedAt: string };
const icons = { schedule: CalendarDays, rankings: Trophy, widgets: Heart, discover: Compass, profile: UserRound };
const labels = { schedule: '赛程', rankings: '积分', widgets: '我的', discover: '探索', profile: '我的' };
type Tab = keyof typeof labels;
const navs = Object.keys(labels).filter(tab=>tab!=='widgets') as Tab[];
const safeGet = (key: string, fallback: any) => { try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; } };
const stamp = (date: string) => new Date(date).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Shanghai' });
const number = (value: any) => value == null ? '—' : String(value);
const teamFile = (r: Row) => canonicalTeam(r);
const color = (r: Row) => /^[a-f0-9]{6}$/i.test(r.teamColor || '') ? `#${r.teamColor}` : '#28dfc0';
const sessionName = (s: Row) => (({ FirstPractice: '第一次自由练习赛', SecondPractice: '第二次自由练习赛', ThirdPractice: '第三次自由练习赛', StandardQualifying: '排位赛', SprintQualifying: '冲刺排位赛', SprintRace: '冲刺赛', MainRace: '正赛' } as Record<string,string>)[s.type] || s.sessionName || '比赛');
const kind = (s: Row) => /Practice/.test(s.type) ? 'practices' : /Qualifying/.test(s.type) ? 'qualifying' : 'races';
const dateParts = (date: string, tz: string, options: Intl.DateTimeFormatOptions) => new Date(date).toLocaleString('zh-CN', { timeZone: tz, ...options });
async function fetchData(resource: string, season: string, extra: Record<string, string> = {}): Promise<Envelope> {
  const response = await fetch('/api/data?' + new URLSearchParams({ resource, season, ...extra }), { signal: AbortSignal.timeout(12000) });
  const json = await response.json() as Envelope & { error?: string };
  if (!response.ok || json.error) throw new Error(json.error || '数据暂不可用');
  return json;
}
function DriverPortrait({driver}:{driver:Row}) {
  const portrait=portraitFor(driver),[failed,setFailed]=useState(false);
  useEffect(()=>setFailed(false),[portrait?.file]);
  return <span className={'driver-portrait '+(portrait?.historical?'historical-portrait':'')}>{portrait&&!failed?<img src={portrait.file} alt={driver.driverName+'的头像'} loading="lazy" onError={()=>setFailed(true)}/>:<UserRound aria-label="头像暂缺"/>}</span>;
}
function Countdown({ date }: { date?: string }) {
  const [now,setNow]=useState(0);
  useEffect(()=>{const sync=()=>{if(!document.hidden)setNow(Date.now());};sync();const timer=setInterval(sync,1000);document.addEventListener('visibilitychange',sync);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',sync);};},[date]);
  const remaining = date && now ? Math.max(0, new Date(date).getTime() - now) : 0;
  const values = [Math.floor(remaining / 86400000), Math.floor(remaining / 3600000) % 24, Math.floor(remaining / 60000) % 60, Math.floor(remaining / 1000) % 60];
  return <div className="countdown" aria-label="开赛倒计时">{values.map((v, i) => <div key={i}><strong>{now ? String(v).padStart(2, '0') : '—'}</strong><span>{['天', '小时', '分钟', '秒'][i]}</span></div>)}</div>;
}
function PanelTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return <div className="panel-title"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2></div>{children}</div>;
}
export default function App({ seed, seededAt }: { seed: Record<string, any>; seededAt: string }) {
  const {tab,detail,setTab,openDetail,driverId,driverSeason,driverFrom,openDriver,closeDriver}=usePaddockNavigation();
  const preferencesRef = useRef<{ flush: () => Promise<void> } | null>(null);
  const account = useAccountControls({ beforeLogout: () => preferencesRef.current?.flush() || Promise.resolve() });
  const preferences = useAccountPreferences(account.status);
  preferencesRef.current = preferences;
  const { theme, accent, timezone } = preferences.preferences;
  const following = { driverIds: preferences.preferences.driverIds, teamIds: preferences.preferences.teamIds };
  const detailInfo=detail?detailPages[detail]:null;
  const [season, setSeason] = useState(snapshotSeason);
  const [data, setData] = useState<Record<string, any>>(seed);
  const [meta, setMeta] = useState<Envelope>({ data: null, source: 'snapshot', updatedAt: seededAt });
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Row | null>(null);
  const [raceList, setRaceList] = useState(false);
  const [pageDirection,setPageDirection]=useState(1);
  function navigateTab(next:Tab){setPageDirection(navs.indexOf(next)>=navs.indexOf(tab)?1:-1);setTab(next);}
  const [replayRaceId,setReplayRaceId]=useState('');
  const [rankType, setRankType] = useState('drivers');
  const [now, setNow] = useState(0);
  const [localTimezone, setLocalTimezone] = useState('Asia/Shanghai');
  const [rankExpanded, setRankExpanded] = useState(false);
  const [rankHelp, setRankHelp] = useState(false);
  const [driver, setDriver] = useState<Row | null>(null);
  const [results, setResults] = useState<{ session: Row; race: Row; loading: boolean; rows?: Row[]; error?: string } | null>(null);
  const [toast, setToast] = useState('');
  const [install, setInstall] = useState(false);
  const [shareCard, setShareCard] = useState<ShareCard | null>(null);
  const [sharedSelection, setSharedSelection] = useState<ReturnType<typeof readSharedSelection> | null>(null);
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

  const pageDriver = driverId ? drivers.find(d => d.driverId === driverId) : null;
  function showDriver(row:Row) { if(row.isTeam)setDriver(row);else openDriver(row.driverId,season,tab); }
  async function shareDriver() { try { await navigator.clipboard.writeText(window.location.href);setToast('车手档案链接已复制'); } catch {setToast('请复制浏览器地址栏中的档案链接');} }
  function shareWeekend() {
    if (!race) return;
    const card = weekendShareCard(race, season, timezone, meta.updatedAt, meta.source);
    const exact = (circuitExtra as Record<string, Row>)[race.circuit?.id];
    const coordinates = exact && Number.isFinite(exact.latitude) && Number.isFinite(exact.longitude) ? [exact.latitude, exact.longitude] : circuitLocations[race.circuit?.nameKey];
    try { card.weather = shareWeather(JSON.parse(localStorage.getItem('paddock-weather-v2-' + coordinates?.join(',')) || 'null'), race); } catch {}
    setShareCard(card);
  }
  function sharePodium(ids = following.driverIds) {
    const chosen = ids.map(id => drivers.find(d => d.driverId === id)).filter(Boolean) as Row[];
    if (!chosen.length) { setToast('先选出你的领奖台阵容'); return; }
    const card = podiumShareCard(chosen, season);
    card.rows.forEach((row, index) => { row.image = portraitFor(chosen[index])?.file; });
    setShareCard(card);
  }


  useEffect(() => {
    window.dispatchEvent(new Event('paddock:ready'));
    const native=/PaddockPocket\//.test(navigator.userAgent);
    if(native)window.location.href='paddock://ready';
    const smg=()=>{if(native)window.location.href='paddock://smg-live';};
    const tencent=()=>{if(native)window.location.href='paddock://open-tencent';};
    window.addEventListener('paddock:open-smg',smg);window.addEventListener('paddock:open-tencent',tencent);
    if(native)window.addEventListener('pagehide',()=>{window.removeEventListener('paddock:open-smg',smg);window.removeEventListener('paddock:open-tencent',tencent);},{once:true});
    setNow(Date.now());
    const shared = readSharedSelection(window.location.search); setSharedSelection(shared);
    if (shared.season) setSeason(shared.season);
    setLocalTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    try { pruneClientCache(localStorage); } catch {}
    const cached = safeGet('paddock-cache', null);
    if (cached?.season === snapshotSeason && cached.data?.next && cached.data?.races) { setData(cached.data); setMeta(cached.meta); }
    const id = setInterval(() => setNow(Date.now()), 60000);
    const syncClock=()=>{if(!document.hidden)setNow(Date.now());};document.addEventListener('visibilitychange',syncClock);
    return () => {clearInterval(id);document.removeEventListener('visibilitychange',syncClock);};
  }, []);
  useEffect(()=>{
    const time=Date.now(),boundary=sessions.flatMap(s=>[+new Date(s.startDate),+new Date(s.endDate)]).filter(at=>Number.isFinite(at)&&at>time).sort((a,b)=>a-b)[0];
    if(!boundary||boundary-time>60000)return;
    const timer=setTimeout(()=>setNow(Date.now()),boundary-time+30);return()=>clearTimeout(timer);
  },[now,race?.id,race?.schedule]);
  useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.dataset.native = /PaddockPocket\//.test(navigator.userAgent)?'android':'web'; }, [theme]);
  useEffect(() => { document.documentElement.dataset.accent = accent; }, [accent]);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(''), 3500); return () => clearTimeout(t); }, [toast]);
  useEffect(() => { load(season); const id=setInterval(()=>{if(document.visibilityState==='visible')load(season);},300000); return ()=>clearInterval(id); }, [season]);

  useEffect(()=>{if(tab==='widgets'&&!driverId)setTab('profile');},[tab,driverId]);
  useEffect(()=>{if(driverId && driverSeason && driverSeason!==season)changeSeason(driverSeason);},[driverId,driverSeason,season]);
  useEffect(()=>{if(sharedSelection?.race && races.length){const sharedRace=races.find(row=>row.id===sharedSelection.race);if(sharedRace)setSelected(sharedRace);}},[sharedSelection?.race,data.races]);

  async function load(seasonId: string) {
    const version = ++raceRef.current;
    setBusy(true); setError('');
    const names = ['seasons', 'races', 'drivers', 'teams', ...(seasonId === snapshotSeason ? ['next'] : [])];
    const responses = await Promise.allSettled(names.map(async name => {
      const result=await fetchData(name,seasonId);
      if(version===raceRef.current)setData(current=>({...current,[name]:result.data}));
      return result;
    }));
    if (version !== raceRef.current) return;
    const nextData: Record<string, any> = {}; const successful: Envelope[] = [];
    responses.forEach((result, i) => { if (result.status === 'fulfilled') { nextData[names[i]] = result.value.data; successful.push(result.value); } });
    if (successful.length) {
      if (seasonId !== snapshotSeason) nextData.next = nextData.races?.items?.find((r: Row) => r.status === 'Scheduled') || nextData.races?.items?.at(-1);
      const merged = { ...data, ...nextData };
      const info = successful.find(r => r.source === 'snapshot') || successful[0];
      setData(merged); setMeta(info);
      try { localStorage.setItem('paddock-cache', JSON.stringify({ storedAt: Date.now(), season: seasonId, data: merged, meta: { ...info, data: null } })); } catch { /* Private mode / storage quota: browsing still works. */ }
    }
    if (responses.some(r => r.status === 'rejected')) setError('部分数据未能更新，可以稍后重试。');
    setBusy(false);
  }
  function changeSeason(value: string) { setRankExpanded(false); setSeason(value); setSelected(null); setData({ seasons: data.seasons }); setError(''); }
  function savePreference(patch: PreferencesPatch) { if (!preferences.change(patch)) setToast('正在读取云端设置，请稍后重试'); }
  function updateFollow(row:Row, team=false) { const id=team?followTeamKey(row):row.driverId; if(!id)return; if(!team&&!following.driverIds.includes(id)&&following.driverIds.length>=3){setToast('领奖台已满，先在我的阵容中更换一位车手');return;} const key=team?'teamIds':'driverIds'; const next=toggleFollowing(following,key,id); savePreference({[key]:next[key]}); }
  function pickFavorite(row:Row) { updateFollow(row); }
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
    <aside className="desktop-rail"><a className="brand" href="#" onClick={e => { e.preventDefault(); setTab('schedule'); }}><img src="/favicon.svg" alt=""/><span>围场口袋<small>F1 赛事与数据</small></span></a><p className="rail-label">PADDOCK POCKET</p><nav aria-label="主导航">{navs.map(t => { const Icon = icons[t]; return <button className={tab === t ? 'active' : ''} key={t} onClick={() => navigateTab(t)}><Icon size={20}/>{labels[t]}<CircleEllipsis size={15}/></button>; })}</nav><div className="rail-bottom"><Flag size={17}/><span>PADDOCK POCKET<br/><b>F1 赛事与数据</b></span></div></aside>
    <div className="workspace"><header className="topbar"><div className="mobile-brand"><img src="/favicon.svg" alt=""/><span>围场口袋</span><small>F1</small></div><div className="desktop-breadcrumb">围场口袋 <Dot size={14}/> {labels[tab]}{detailInfo&&<><Dot size={14}/>{detailInfo.title}</>}</div><div className="header-tools"><span className="season-tag">{year} SEASON</span><button aria-label="刷新数据" className={'icon-button ' + (busy ? 'spinning' : '')} onClick={() => load(season)} disabled={busy}><RefreshCw size={18}/></button></div></header>
      <main id="main" className={"main-content "+(detail?'detail-page':'')+(tab==='profile'?' profile-main':'')+(driverId?' driver-page':'')+(tab==='schedule'&&!detail?' schedule-main':'')}>{detail&&<button className="text-button tool-back subpage-back" onClick={()=>setTab(tab)}><ArrowLeft size={16}/>返回{labels[tab]}</button>}{!driverId&&<div className="page-heading"><div><p className="eyebrow">{detailInfo?.en || (tab === 'schedule' ? 'RACE WEEKEND' : tab === 'rankings' ? 'THE CHAMPIONSHIP' : tab === 'widgets' ? 'YOUR SIDE OF THE GRID' : tab === 'discover' ? 'BEYOND THE GRID' : 'YOUR OWN PADDOCK')}</p><h1>{detailInfo?.title || (tab === 'schedule' ? '赛程' : tab === 'rankings' ? '积分榜' : tab === 'widgets' ? '我的关注' : tab === 'discover' ? '探索' : '我的围场')}</h1></div>{(['schedule','rankings'].includes(tab)||detail==='replays') && seasonSelect}</div>}
      <Suspense fallback={<p className="empty" role="status">正在打开页面…</p>}><div className="route-content" key={tab+detail+driverId} style={{'--page-shift':(pageDirection*32)+'px'} as React.CSSProperties}>{error && <div role="status" className="notice"><WifiOff size={16}/>{error}<button onClick={() => load(season)}>重试</button></div>}

      {detail&&<div className={'detail-workspace tone-'+detailInfo?.tone} key={detail}>{detail==='viewing'?<ViewingRoom onReplay={()=>openDetail('replays')}/>:detail==='replays'?<ReplayLibrary races={races} year={year} focusedRaceId={replayRaceId} loading={busy&&!races.length}/>:detail==='news'?<NewsRoom/>:detail==='classics'?<ClassicRaces/>:detail==='circuit'?(race?<><div className="archive-preview"><CircuitImage circuit={race.circuit}/><div><p className="eyebrow">ROUND {race.round} / {year}</p><h2>{race.name}</h2><p>{race.circuit?.place}</p></div></div><CircuitArchive race={race}/></>:<p className="empty">请先选择一场比赛。</p>):detail==='championship'?<Championship drivers={drivers} races={races} updatedAt={meta.updatedAt} source={meta.source} year={year}/>:<ToolsHub seasons={data.seasons?.items||[]} page={detail}/>}</div>}
      {tab === 'schedule' && !detail && <>
        <div className="schedule-toolbar"><div className="segmented"><button className={!raceList ? 'selected' : ''} onClick={() => setRaceList(false)}>比赛周末</button><button className={raceList ? 'selected' : ''} onClick={() => setRaceList(true)}>完整赛历 <span>{races.length || '—'}</span></button></div>{race && <button className="weekend-share-button" onClick={shareWeekend}><Share2 size={15}/>分享周末</button>}{selected && <button className="text-button" onClick={() => {setSelected(null);setRaceList(false);}}>返回下一站 <CircleEllipsis size={15}/></button>}</div>
        {raceList ? <section className="calendar-grid" aria-label="完整赛历">{races.length ? races.map(r => <button key={r.id} className={'race-tile ' + (r.id === race?.id ? 'chosen' : '')} onClick={() => {setSelected(r);setRaceList(false);}}><span className="round">ROUND {String(r.round).padStart(2,'0')}</span><span className={'status-pill ' + (r.status === 'Finished' ? 'muted' : '')}>{r.status === 'Finished' ? '已完赛' : '待发车'}</span><h3>{r.name}</h3><p>{r.circuit?.place || r.circuit?.name}</p><div><span>{dateParts(r.startDate, timezone, {month:'2-digit',day:'2-digit'})} — {dateParts(r.endDate, timezone, {month:'2-digit',day:'2-digit'})}</span><CircleEllipsis size={19}/></div></button>) : <div className="empty">{busy ? '正在载入赛历…' : '这个赛季暂时没有赛历数据。'}</div>}</section> : race ? <div className="weekend-dashboard">
          <RaceHero race={race} year={year} selected={!!selected} dateLabel={dateParts(race.startDate, timezone, {month:'long',day:'numeric'})+' — '+dateParts(race.endDate, timezone, {month:'long',day:'numeric'})} sessionLabel={nextSession?sessionName(nextSession):''} countdown={nextSession?<Countdown date={nextSession.startDate}/>:null}/>
          <div className="weather-slot"><WeatherCard race={race} timezone={timezone}/></div><div className="weekend-detail-grid"><section className="schedule-section"><PanelTitle title="赛事时间安排" eyebrow="THE WEEKEND"><label className="zone-select"><Clock3 size={13}/><TimezonePicker label="时间显示方式" value={timezone} localTimezone={localTimezone} onChange={value=>savePreference({timezone:value})}/></label></PanelTitle>{Object.entries(dateGroups).map(([day, items]) => <div className="day-group" key={day}><h3>{day}</h3>{items.map(s => <div className={'session-row ' + (s.id === nextSession?.id ? 'up-next' : '')} key={s.id}><button className="session-main" onClick={() => viewResults(s)}><span className={'session-mark ' + (/Race/.test(s.type) ? 'race' : /Qualifying/.test(s.type) ? 'quali' : '')}>{s.sessionShortName}</span><div><strong>{sessionName(s)}</strong><span>{+new Date(s.startDate) > now ? '即将开始' : +new Date(s.endDate) > now ? '场次进行中' : '查看比赛成绩'}</span></div><time>{dateParts(s.startDate, timezone, {hour:'2-digit',minute:'2-digit',hour12:false})}</time></button><button className="calendar-button" aria-label={'添加' + sessionName(s) + '到日历'} onClick={() => calendar(s)}><Bell size={17}/></button></div>)}</div>)}</section>
        <aside className="weekend-secondary"><section className="card circuit-brief tone-mint"><div className="panel-title"><div><p className="eyebrow">KNOW THE CIRCUIT</p><h2>赛道概览</h2></div><Flag size={20}/></div><h3>{race.circuit?.name}</h3><div className="circuit-brief-stats"><div><strong>{race.trackLength || (race.circuit?.trackSize?race.circuit.trackSize/1000:'—')}<small> km</small></strong><span>单圈长度</span></div><div><strong>{race.scheduledLaps || '—'}<small> 圈</small></strong><span>正赛圈数</span></div></div><SectionLink id="circuit" onOpen={openDetail} compact/></section>
          <section className="card"><PanelTitle title="本站轮胎" eyebrow="ON THE RUBBER"/><div className="tyres">{(race.tyreSet?.tyres || []).filter((t: Row) => !t.isWet).map((t: Row) => <div key={t.type}><span className={'tyre ' + t.type.toLowerCase()}>{t.compound || t.type[0]}</span><small>{({Hard:'硬胎',Medium:'中性胎',Soft:'软胎'} as Record<string,string>)[t.type] || t.type}</small></div>)}</div>{!race.tyreSet?.tyres?.length && <p className="muted-text">轮胎配方尚未公布</p>}</section>
</aside></div></div> : <div className="empty">{busy ? '正在准备比赛周末…' : '这个赛季暂时没有可显示的赛事。'}</div>}
      </>}
      {tab === 'rankings' && !detail && !driverId && <section className="standings-section"><div className="rank-toolbar"><div className="segmented"><button className={rankType === 'drivers' ? 'selected' : ''} onClick={() => {setRankType('drivers');setRankExpanded(false);}}>车手积分榜</button><button className={rankType === 'teams' ? 'selected' : ''} onClick={() => {setRankType('teams');setRankExpanded(false);}}>车队积分榜</button></div><button className="rank-help-button" aria-expanded={rankHelp} aria-controls="rank-help" onClick={()=>setRankHelp(!rankHelp)}><Info size={15}/><span>查看档案</span></button></div>{rankHelp&&<p className="rank-help" id="rank-help" role="status">点击车手姓名或右侧箭头，查看生涯成就、资料和新闻。爱心可分别关注多位车手或整支车队。</p>}<div className="standings-labels"><span>排名 / {rankType==='drivers'?'车手':'车队'}</span><span>积分</span></div><div className="rank-list" data-expanded={rankExpanded} key={rankType+season}>{(rankExpanded?(rankType==='drivers'?drivers:teams):(rankType==='drivers'?drivers:teams).slice(0,5)).map((r,i)=><div key={r.driverId||r.teamId} className={'rank-row position-'+r.position} style={{'--team-color':color(r)} as React.CSSProperties}><span className="position">{String(r.position).padStart(2,'0')}</span>{rankType==='drivers'?<button className="rank-person" onClick={()=>showDriver(r)} aria-label={'查看'+r.driverName+'档案'}><DriverPortrait driver={r}/><span><strong>{r.driverName}</strong><small><i style={{background:color(r)}}/>{r.teamName||r.teamShortName}<em>#{r.number}</em></small></span><ContactRound className="rank-open-arrow" size={15}/></button>:<button className="rank-person" onClick={()=>setDriver({...r,isTeam:true})} aria-label={'查看'+r.teamName+'资料'}>{year===2026&&teamFile(r)?<img className="rank-car" src={'/cars/'+teamFile(r)+'.png'} alt="车队赛季展示图"/>:<Flag size={30}/>}<span><strong>{r.teamName||r.teamShortName}</strong><small>{r.teamShortName}</small></span><ContactRound className="rank-open-arrow" size={15}/></button>}<div className="rank-points"><strong>{r.points}</strong><span>{i?'−'+((rankType==='drivers'?drivers:teams)[0].points-r.points):'LEADER'}</span></div><button className={'favorite-button '+((rankType==='drivers'?following.driverIds.includes(r.driverId):following.teamIds.includes(followTeamKey(r)))?'picked':'')} aria-pressed={rankType==='drivers'?following.driverIds.includes(r.driverId):following.teamIds.includes(followTeamKey(r))} aria-label={((rankType==='drivers'?following.driverIds.includes(r.driverId):following.teamIds.includes(followTeamKey(r)))?'取消关注':'关注')+(r.driverName||r.teamName)} onClick={()=>updateFollow(r,rankType==='teams')}><Heart size={17} fill={(rankType==='drivers'?following.driverIds.includes(r.driverId):following.teamIds.includes(followTeamKey(r)))?'currentColor':'none'}/></button></div>)}</div>{(rankType==='drivers'?drivers:teams).length>5&&<button className="rank-expand" aria-expanded={rankExpanded} onClick={()=>setRankExpanded(!rankExpanded)}>{rankExpanded?'收起榜单':'展开完整榜单'}<span>{(rankType==='drivers'?drivers:teams).length}</span><ChevronDown size={17} className={rankExpanded?'is-expanded':''}/></button>}{!(rankType==='drivers'?drivers:teams).length&&<div className="empty">{busy?'正在加载积分榜…':'该赛季暂无积分数据。'}</div>}<div className="championship-utility"><Trophy size={17}/><div><strong>争冠计算器</strong><span>推演夺冠所需的积分与名次</span></div><button className="icon-button" aria-label="打开争冠分析" onClick={()=>openDetail('championship')}><CircleEllipsis size={18}/></button></div></section>}
      {driverId && <section className="driver-profile-page" aria-label="车手完整档案"><div className="driver-page-toolbar"><button className="driver-back-button" onClick={closeDriver}><ArrowLeft size={17}/>返回{labels[driverFrom]}</button><span className="eyebrow">DRIVER PROFILE</span><button className="driver-share-button" onClick={()=>void shareDriver()} aria-label="复制车手档案链接"><Share2 size={17}/><span>分享档案</span></button></div>{pageDriver && (!driverSeason || driverSeason===season) ? <DriverDetails key={pageDriver.driverId+'-'+season} driver={pageDriver} year={year} race={season===snapshotSeason?data.next:undefined} favorite={following.driverIds.includes(pageDriver.driverId)} onFavorite={()=>pickFavorite(pageDriver)}/> : <div className="driver-page-empty" role="status"><UserRound size={36}/><h1>{busy||driverSeason!==season?'正在准备车手档案':'该赛季暂无这位车手的积分资料'}</h1><p>{busy?'正在连接赛事数据…':'可以返回积分榜选择其他赛季或车手。'}</p>{!busy&&<button className="small-button" onClick={()=>load(season)}>重新加载</button>}</div>}</section>}
      {tab === 'discover' && !detail && <DiscoverOverview onOpen={openDetail}/>}
      {tab === 'profile' && <>{!!sharedSelection?.podium.length&&<div className="shared-podium-notice"><span>朋友分享了他的领奖台阵容，不会更改你的关注。</span><button className="small-button" disabled={busy||!drivers.length} onClick={()=>sharePodium(sharedSelection.podium)}>查看阵容</button><button className="icon-button" aria-label="关闭分享提示" onClick={()=>setSharedSelection(null)}>×</button></div>}<ProfilePage onSharePodium={()=>sharePodium()} drivers={drivers} teams={teams} following={following} onPickDriver={pickFavorite} onPickTeam={row=>updateFollow(row,true)} onOpenDriver={showDriver} loadingDrivers={busy&&!drivers.length} account={account} sync={preferences} theme={theme} accent={accent} timezone={timezone} localTimezone={localTimezone} onTheme={value=>savePreference({theme:value as PreferencesPatch['theme']})} onAccent={value=>savePreference({accent:value as PreferencesPatch['accent']})} onTimezone={value=>savePreference({timezone:value})} onInstall={()=>setInstall(true)}/><WatchGuide/></>}
      </div><footer className="data-footer"><span><i className={meta.source === 'live' ? 'online' : ''}/>{busy ? '正在更新…' : meta.source === 'live' ? '在线数据' : '最近保存'} · {stamp(meta.updatedAt)}</span><a className="about-mini-link" href="/about">关于围场口袋</a></footer>
      </Suspense></main></div>
    <GlassNavigation tab={tab} onChange={navigateTab}/>
    {shareCard && <Suspense fallback={null}><SharePosterDialog card={shareCard} close={()=>setShareCard(null)}/></Suspense>}
    {toast && <div className="toast" role="status"><Check size={17}/>{toast}</div>}
    {driver?.isTeam && <Suspense fallback={null}><Dialog title={driver.teamName} close={() => setDriver(null)}><TeamCarStage team={driver} year={year}/><div className="driver-detail" style={{'--team-color':color(driver)} as React.CSSProperties}><p>{year} 赛季 · {driver.teamName}</p><div className="detail-stats"><div><span>赛季排名</span><strong>P{driver.position}</strong></div><div><span>积分</span><strong>{driver.points}</strong></div></div></div><WeekendLook driver={driver} year={year} race={season===snapshotSeason?data.next:undefined}/><NewsRoom compact team={driver.teamShortName}/></Dialog></Suspense>}
    {results && <Dialog title={sessionName(results.session)} close={() => {resultRef.current++;setResults(null);}}><p className="result-subtitle">{results.race.name} · {dateParts(results.session.startDate,timezone,{month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'})}</p>{results.loading ? <div className="empty">正在读取比赛成绩…</div> : results.error ? <div className="empty"><WifiOff size={30}/><p>{results.error}</p><button className="small-button" onClick={() => viewResults(results.session,results.race)}>重试</button></div> : !results.rows?.length ? <div className="empty">{+new Date(results.session.startDate) > now ? '比赛尚未开始，成绩将在结束后公布。' : '暂时没有这场比赛的成绩。'}</div> : <div className="results-table"><div className="results-heading"><span>名次 / 车手</span><span>成绩</span></div>{[...results.rows].sort((a,b) => (a.result?.position || a.position || 999)-(b.result?.position || b.position || 999)).map((p,i) => <div className="result-row" key={p.driverId || i}><b>{p.result?.position || p.position || '—'}</b><span><strong>{p.driverName || p.driverTla}</strong><small>{p.teamName || p.driverTla}</small></span><time>{resultLabel(p)}</time></div>)}</div>}</Dialog>}
    {install && <Dialog title="把围场添加到主屏幕" close={() => setInstall(false)}><div className="install-instructions"><img src="/favicon.svg" alt="围场图标"/><h3>添加围场口袋</h3><ol><li>在 iPhone 的 Safari 中打开本站。</li><li>点击浏览器的“分享”按钮。</li><li>选择“添加到主屏幕”，再点击“添加”。</li></ol><p>如果当前在其他 App 内打开，请先选择“在 Safari 中打开”。</p></div></Dialog>}
  </div>;
}
