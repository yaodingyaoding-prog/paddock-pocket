'use client';
import { ArrowUpRight, CalendarDays, Clock3, Flag, MapPin } from 'lucide-react';
import type { ReactNode } from 'react';
import { CircuitImage } from './circuit';

type Row = Record<string, any>;
export function RaceHero({race,year,dateLabel,sessionLabel,selected,countdown,onCircuit,onViewing,onReplay}:{race:Row;year:number;dateLabel:string;sessionLabel:string;selected:boolean;countdown:ReactNode;onCircuit:()=>void;onViewing:()=>void;onReplay:()=>void}) {
  const length = race.trackLength || (race.circuit?.trackSize ? race.circuit.trackSize / 1000 : null);
  const finished = race.status === 'Finished';
  return <section className="weekend-hero" aria-label={race.name+'比赛周末'}>
    <div className="weekend-hero-heading"><span className="hero-round"><Flag size={15}/>ROUND {String(race.round).padStart(2,'0')}<span>/ {year}</span></span><span className={'hero-race-status'+(finished?' is-finished':'')}><i/>{finished?'比赛回顾':selected?'已选分站':'下一站大奖赛'}</span></div>
    <div className="weekend-hero-body"><div className="weekend-hero-copy"><p className="hero-event-name">{race.nameKey || race.officialName}</p><h2>{race.name}</h2><p className="hero-venue"><MapPin size={16}/><span>{race.circuit?.name}<small>{race.circuit?.place}</small></span></p><p className="hero-event-date"><CalendarDays size={16}/>{dateLabel}</p><div className="hero-race-facts">{[[length,'km','单圈长度'],[race.scheduledLaps,'圈','正赛圈数'],[race.circuit?.totalCorners,'','弯道']].map(([value,unit,label])=><div key={label}><strong>{value || '—'}<small>{unit}</small></strong><span>{label}</span></div>)}</div><div className="hero-race-actions"><button className="race-primary-action" onClick={finished?onReplay:onViewing}>{finished?'查看本站回放':'进入观赛中心'}<ArrowUpRight size={17}/></button><button className="race-secondary-action" onClick={onCircuit}>认识这条赛道<ArrowUpRight size={16}/></button></div></div><div className="weekend-hero-stage"><span className="hero-stage-title">THE CIRCUIT<span>3D</span></span><div className="hero-track-orbit" aria-hidden="true"/><CircuitImage circuit={race.circuit}/><span className="hero-stage-caption">{race.circuit?.place}<span>点击赛道，探索布局</span></span><span className="hero-round-watermark" aria-hidden="true">{String(race.round).padStart(2,'0')}</span></div></div>
    <div className="weekend-hero-timing"><div className="hero-timing-copy"><span><Clock3 size={15}/>{sessionLabel || (finished?'比赛周末已结束':'暂无后续场次')}</span><small>{countdown?'距离发车':finished?'WEEKEND COMPLETE':'等待赛程更新'}</small></div>{countdown || <span className="hero-finished-mark"><Flag size={24}/>{finished?'FINISHED':'RACE WEEKEND'}</span>}</div>
  </section>;
}
