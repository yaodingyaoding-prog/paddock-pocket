'use client';
import {useEffect,useRef,useState} from 'react';
import { Clapperboard, Link2, Search } from 'lucide-react';
import {replayLinks,replayRaceMatches,replaySessions,type ReplaySession} from '../lib/race-replays';

export function ReplayLibrary({races,year,focusedRaceId,loading=false}:{races:Record<string,any>[];year:number;focusedRaceId?:string;loading?:boolean}) {
  const [search,setSearch]=useState(''),[session,setSession]=useState<ReplaySession>('race');
  const grid=useRef<HTMLDivElement>(null);
  useEffect(()=>{setSearch('');setSession('race');},[year,focusedRaceId]);
  useEffect(()=>{if(!focusedRaceId)return;const row=grid.current?.querySelector<HTMLElement>('[data-race-id="'+CSS.escape(focusedRaceId)+'"]');row?.scrollIntoView({block:'center',behavior:'smooth'});},[focusedRaceId,year]);
  const filtered=races.filter(race=>replayRaceMatches(race,search,session));
  return <section className="replay-library" aria-label="赛事回放">
    <div className="replay-library-toolbar"><div className="segmented" aria-label="回放场次">{replaySessions.map(item=><button key={item.id} aria-pressed={session===item.id} className={session===item.id?'selected':''} onClick={()=>setSession(item.id)}>{item.label}</button>)}</div><label className="replay-search"><Search size={16}/><input aria-label="搜索回放比赛" value={search} onChange={event=>setSearch(event.target.value)} placeholder="搜索比赛或赛道"/></label></div>
    <div className="replay-library-summary"><span>{year} 赛季</span><span>{filtered.length} 场比赛</span></div>
    <div className="replay-race-grid" ref={grid}>{filtered.map(race=>{
      const links=replayLinks(year,race.name,session),finished=race.status==='Finished';
      return <article key={race.id} data-race-id={race.id} className={'card replay-race-card'+(race.id===focusedRaceId?' replay-focused':'')}>
        <div className="replay-card-meta"><span className="eyebrow">ROUND {String(race.round).padStart(2,'0')}</span><span className={'status-pill '+(finished?'muted':'')}>{finished?'已完赛':'待开赛'}</span></div>
        <Clapperboard className="replay-card-icon" size={24}/><h2>{race.name}</h2><p>{race.circuit?.name||race.circuit?.place}</p>
        <div className="replay-platforms"><a href={links.bilibili} target="_blank" rel="noopener noreferrer"><span>B</span>B 站回放 <Link2 size={13}/></a><a href={links.tencent} target="_blank" rel="noopener noreferrer"><span className="tencent-play">▶</span>腾讯视频 <Link2 size={13}/></a></div>
      </article>;
    })}</div>
    {!filtered.length&&<p className="empty" role="status">{loading?'正在载入赛历…':'没有匹配的比赛'}</p>}
    <p className="section-note replay-platform-note">入口按比赛与场次检索，播放及会员服务由对应平台提供。</p>
  </section>;
}
