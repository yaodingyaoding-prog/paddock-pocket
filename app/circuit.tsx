'use client';
import { Flag, Gauge, Trophy } from 'lucide-react';
import {useEffect,useState} from 'react';
import extras from '../lib/circuit-extra.json';
import {CircuitPreview} from './circuit-scene';
type Row=Record<string,any>;
const text=(v:unknown)=>v===null||v===undefined||v===''?'待公布':String(v);
export function CircuitArchive({race}:{race:Row}) {
  const c=race.circuit||{};
  const extra=(extras as Record<string,Row>)[c.id]||{};
  const length=race.trackLength||(c.trackSize?c.trackSize/1000:null);
  const stats=[['单圈长度',length?`${length} km`:null],['正赛圈数',race.scheduledLaps],['比赛距离',race.scheduledDistance?`${race.scheduledDistance} km`:null],['弯道数量',c.totalCorners],['左弯 / 右弯',c.leftCorners!=null&&c.rightCorners!=null?`${c.leftCorners} / ${c.rightCorners}`:null],['首次举办 F1',c.firstRaceDate]];
  return <section className="card track-card" aria-label="赛道完整档案"><div className="panel-title"><div><h2>赛道档案</h2></div><Flag size={22}/></div><h3>{c.name}</h3><p className="muted-text">{c.countryName} / {c.place}</p><div className="circuit-stats">{stats.map(([label,v])=><div key={String(label)}><span>{label}</span><strong>{text(v)}</strong></div>)}</div><div className="circuit-records"><div><Gauge size={18}/><div><span>正赛圈速纪录</span><strong>{text(c.lapRecord?.time)}</strong><small>{c.lapRecord?.driverName||'车手待公布'} · {c.lapRecord?.seasonYear||'年份待公布'}{c.lapRecord?.teamName?` · ${c.lapRecord.teamName}`:''}</small></div></div><div><Gauge size={18}/><div><span>排位圈速纪录</span><strong>{text(c.qualifyingLapRecord?.time)}</strong><small>{c.qualifyingLapRecord?.driverName||'车手待公布'} · {c.qualifyingLapRecord?.seasonYear||'年份待公布'}</small></div></div></div><details className="circuit-more"><summary>历届纪录与赛道特征</summary><dl><div><dt>最多分站胜利 · 车手</dt><dd>{text(c.mostWinsDriver?.name)}<small>{text(c.mostWinsCount)} 胜</small></dd></div><div><dt>最多分站胜利 · 车队</dt><dd>{text(c.mostWinsTeam?.name)}<small>{text(c.mostWinsTeamCount)} 胜</small></dd></div><div><dt>最多杆位 · 车手</dt><dd>{text(c.mostPolesDriver?.name)}<small>{text(c.mostPolesCount)} 次</small></dd></div><div><dt>杆位转化为冠军</dt><dd>{text(c.poleConversionRate)}</dd></div><div><dt>最高时速</dt><dd>{text(c.topSpeed)}<small>{c.topSpeedDriver?.name||'车手待公布'} · {c.topSpeedYear||'年份待公布'}</small></dd></div><div><dt>赛道最大落差</dt><dd>{text(c.elevation)}</dd></div><div><dt>行驶方向</dt><dd>{({Clockwise:"顺时针",AntiClockwise:"逆时针"} as Row)[extra.trackDirection]||"暂无资料"}</dd></div><div><dt>杆位侧</dt><dd>{({Left:"左侧",Right:"右侧"} as Row)[extra.poleSide]||"暂无资料"}</dd></div><div><dt>布局年份</dt><dd>{text(extra.currentLayout)}</dd></div></dl></details></section>;
}

export const CircuitImage=CircuitPreview;
