'use client';
import { useState, type CSSProperties } from 'react';
import { canonicalTeam } from '../lib/race-media';
import './team-car.css';
// Bundled images describe the 2026 team, never an individual driver's car or an unverified special livery.
export function TeamCarStage({team,year}:{team:Record<string,any>;year:number}) {
 const key=canonicalTeam(team),[failed,setFailed]=useState('');
 if(year!==2026||!key||failed===key)return null;
 return <figure className="team-car-stage" key={key} style={{'--car-color':/^[a-f0-9]{6}$/i.test(team.teamColor||'')?'#'+team.teamColor:'var(--accent)'} as CSSProperties}><div className="car-stage-caption"><span>THE MACHINE</span><strong>{team.teamShortName||team.teamName}</strong><small>2026 · 车队赛季展示图</small></div><div className="car-stage-platform"><span aria-hidden="true"/><img src={'/cars/'+key+'.png'} alt={(team.teamName||team.teamShortName)+'2026赛季赛车展示图'} onError={()=>setFailed(key)}/></div></figure>;
}
