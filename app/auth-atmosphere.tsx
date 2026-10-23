'use client';
import { useEffect, useRef } from 'react';

export function AuthAtmosphere() {
  const host=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const shell=host.current?.closest<HTMLElement>('.auth-shell');
    const update=()=>{if(shell)shell.dataset.sceneHidden=String(document.hidden);};
    update();document.addEventListener('visibilitychange',update);
    return()=>{document.removeEventListener('visibilitychange',update);if(shell)delete shell.dataset.sceneHidden;};
  },[]);
  return <div ref={host} className="auth-atmosphere" aria-hidden="true"><span className="auth-race-glow"/><span className="auth-horizon-line"/><span className="auth-horizon-line horizon-second"/></div>;
}
