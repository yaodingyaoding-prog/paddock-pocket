'use client';
import { useEffect, useRef } from 'react';

export function AuthAtmosphere() {
 const host=useRef<HTMLDivElement>(null);
 useEffect(()=>{const update=()=>{if(host.current)host.current.dataset.hidden=String(document.hidden);};update();document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
 return <div ref={host} className="auth-atmosphere" aria-hidden="true"><span className="auth-aurora aurora-a"/><span className="auth-aurora aurora-b"/><span className="auth-aurora aurora-c"/><div className="auth-flow-grid"/>
  <svg className="auth-flow-circuit" viewBox="0 0 1000 800" preserveAspectRatio="xMidYMid slice" fill="none"><path className="auth-flow-base" d="M-100 640 190 640Q260 640 260 570V460Q260 390 330 390H570Q640 390 640 320V220Q640 150 710 150H1100"/><path className="auth-flow-trace" d="M-100 640 190 640Q260 640 260 570V460Q260 390 330 390H570Q640 390 640 320V220Q640 150 710 150H1100"/><path className="auth-flow-trace trace-second" d="M-100 640 190 640Q260 640 260 570V460Q260 390 330 390H570Q640 390 640 320V220Q640 150 710 150H1100"/></svg>
  {[0,1,2,3,4].map(index=><span key={index} className={'auth-speed-streak streak-'+index}/>)}
 </div>;
}
