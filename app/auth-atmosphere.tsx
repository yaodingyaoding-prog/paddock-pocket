'use client';
import { useEffect, useRef } from 'react';

export function AuthAtmosphere() {
 const host=useRef<HTMLDivElement>(null);
 useEffect(()=>{const update=()=>{if(host.current)host.current.dataset.hidden=String(document.hidden);};update();document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
 return <div ref={host} className="auth-atmosphere" aria-hidden="true"><span className="auth-aurora aurora-a"/><span className="auth-aurora aurora-b"/><span className="auth-aurora aurora-c"/><div className="auth-flow-grid"/>
  {[0,1,2,3,4].map(index=><span key={index} className={'auth-speed-streak streak-'+index}/>)}
 </div>;
}
