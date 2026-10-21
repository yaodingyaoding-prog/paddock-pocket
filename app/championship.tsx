'use client';
import { useState } from 'react';
import { clinchConditions, racePoints, sprintPoints, Rival } from '../lib/championship';
type Row=Record<string,any>;
export function Championship({drivers,races,updatedAt,source,year}:{drivers:Row[];races:Row[];updatedAt:string;source:string;year:number}) {
  const [chosen,setChosen]=useState('');
  const [position,setPosition]=useState(1);
  const [sprintPosition,setSprintPosition]=useState(1);
  const rivals=drivers as Rival[];
  const target=rivals.find(d=>d.driverId===chosen)||rivals[0];
  // A started but unfinished round could already have partially awarded points: do not infer that state.
  const future=races.filter(r=>!['Finished','Cancelled','Canceled'].includes(r.status)).sort((a,b)=>+new Date(a.startDate)-+new Date(b.startDate));
  const next=future[0];
  const running=next?.schedule?.some((s:Row)=>+new Date(s.startDate)<=Date.now());
  const count=(rs:Row[])=>rs.reduce((sum,r)=>sum+(r.schedule||[]).reduce((n:number,s:Row)=>n+(s.type==='MainRace'?25:s.type==='SprintRace'?8:0),0),0);
  const remaining=count(future);
  const after=count(future.slice(1));
  const leader=Math.max(0,...rivals.map(d=>d.points));
  const needed=target?Math.max(0,Math.max(0,...rivals.filter(d=>d.driverId!==target.driverId).map(d=>d.points+remaining))-target.points+1):0;
  const sprint=!!next?.schedule?.some((s:Row)=>s.type==='SprintRace');
  const missing=future.some(r=>r.status!=='Scheduled'||!r.schedule?.some((s:Row)=>s.type==='MainRace'));
  const ready=year===2026 && !!target && !!next && !running && !missing;
  const conditions=ready?clinchConditions(target,rivals,position,sprint?sprintPosition:null,after,future.length-1):[];
  const impossible=conditions.some(c=>!c.allowed.some(a=>!a.tie||a.tieSafe));
  const legalCount=(11-(position<=10?1:0))*(sprint?(9-(sprintPosition<=8?1:0)):1);
  const constrained=conditions.filter(c=>c.allowed.filter(a=>!a.tie||a.tieSafe).length<legalCount);
  const worst=(c:ReturnType<typeof clinchConditions>[number])=>{
    const strict=c.allowed.filter(a=>!a.tie||a.tieSafe);
    if(!strict.length) return c.allowed.length?'最多追成同分，需核对同分规则':'本轮无法拉开足够分差';
    if(!sprint) {const best=Math.min(...strict.map(a=>a.race));return strict.length===legalCount?'任何可行名次':best===11?'第 11 名及以后 / 不得分':`第 ${best} 名及以后`;}
    return `本站合计不超过 ${Math.max(...strict.map(a=>a.points))} 分（正赛＋冲刺）`;
  };
  return <section className="championship-section"><div className="panel-title"><div><p className="eyebrow">TITLE PERMUTATIONS</p><h2>夺冠条件计算器</h2></div></div><p className="intro-copy">先算积分条件。每场按完整积分计算，不使用胜率预测。</p><div className="card championship-card"><div className="championship-controls"><label>分析车手<select aria-label="分析车手" value={target?.driverId||''} onChange={e=>setChosen(e.target.value)}>{rivals.map(d=><option key={d.driverId} value={d.driverId}>{d.driverName}</option>)}</select></label><label>下站正赛名次<select aria-label="假设正赛名次" value={position} onChange={e=>setPosition(+e.target.value)}>{racePoints.map((p,i)=><option key={i} value={i+1}>{i===10?'11 名以后 / 0 分':`第 ${i+1} 名 · ${p} 分`}</option>)}</select></label>{sprint&&<label>冲刺名次<select aria-label="假设冲刺名次" value={sprintPosition} onChange={e=>setSprintPosition(+e.target.value)}>{sprintPoints.map((p,i)=><option key={i} value={i+1}>{i===8?'9 名以后 / 0 分':`第 ${i+1} 名 · ${p} 分`}</option>)}</select></label>}</div>{ready&&<p className="section-note">{target.points+remaining<leader?`按当前赛历，${target.driverName}即使余下拿满也最多 ${target.points+remaining} 分，已无法追上当前榜首。`:needed<=remaining?`稳妥积分门槛：余下再取 ${needed} 分，可严格超过所有对手的积分上界。这是假设对手拿满积分的充分保证，不是最低必要分数。`:'对手若拿满剩余积分，无法仅靠自己的得分保证夺冠；需要结合对手失分。'}</p>}
    {ready?<><div className="title-summary"><span>下一站：{next.name}</span><strong>{impossible?'这一设定下，无法仅凭积分在下站锁定冠军。':'满足下列所有对手条件，即可在下站按积分及胜场规则锁定冠军。'}</strong><p>余下 {future.length} 场正赛，个人最多再得 {remaining} 分；下站之后最多还剩 {after} 分。</p></div><div className="condition-list">{constrained.map(c=><div key={c.rival.driverId}><span>{c.rival.driverName}<small>当前 {c.rival.points} 分</small></span><strong>{worst(c)}{c.allowed.some(a=>a.tie&&!a.tieSafe)&&<small>边界同分需进一步核对</small>}{c.allowed.some(a=>a.tieSafe&&a.tie)&&<small>同分边界已按胜场上限核验</small>}</strong></div>)}</div><p className="section-note">其余 {conditions.length-constrained.length} 位对手，在此设定下的任何合法名次均不影响锁冠。</p></>:<p className="weather-message">{year!==2026?'当前计算器仅配置了 2026 积分规则。':running?'本站已有场次开始。待积分与完整赛果更新并核对后，再计算提前夺冠条件。':!next?'本赛季已无可计算的后续赛事。':'赛历或积分数据不完整，暂不计算。'}</p>}
    <p className="section-note">依据{source==='live'?'最近获取':'已保存'}的积分与赛历：{new Date(updatedAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})}（北京时间）。假定全部剩余赛事按赛历举行并正常授予积分；缩短、取消或处罚后须重新计算。多个对手必须同时满足条件。同分时先按正赛胜场比较；胜场也无法决定时保留待核对状态，须比较完整正赛及排位名次。</p><a className="text-button" target="_blank" rel="noopener noreferrer" href="https://www.fia.com/regulation/category/110">查看 FIA 规则</a></div></section>;
}
