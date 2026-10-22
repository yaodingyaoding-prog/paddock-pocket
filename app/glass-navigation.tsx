'use client';
import { CalendarDays, Compass, Trophy, UserRound } from 'lucide-react';
import { useEffect, useState, type CSSProperties } from 'react';
import type { NavTab } from './paddock-navigation';
import './glass-navigation.css';
const items = [{ id: 'schedule', label: '赛程', Icon: CalendarDays }, { id: 'rankings', label: '积分', Icon: Trophy }, { id: 'discover', label: '探索', Icon: Compass }, { id: 'profile', label: '我的', Icon: UserRound }] as const;
export function GlassNavigation({ tab, onChange }: { tab: NavTab; onChange: (tab: NavTab) => void }) {
 const [intent,setIntent]=useState<NavTab|null>(null);
 useEffect(()=>setIntent(null),[tab]);
 const selected=intent||tab;
 const index = Math.max(0, items.findIndex(item => item.id === (selected === 'widgets' ? 'profile' : selected)));
 return <nav className="bottom-nav liquid-nav" aria-label="底部导航" style={{ '--nav-index': index } as CSSProperties}><span className="glass-lens" aria-hidden="true"><span className="glass-liquid"/></span>{items.map(({id,label,Icon})=><button key={id} className={selected===id?'active':''} aria-current={tab===id?'page':undefined} onPointerDown={event=>{if(event.button===0)setIntent(id);}} onPointerCancel={()=>setIntent(null)} onPointerLeave={event=>{if(event.buttons)setIntent(null);}} onPointerUp={()=>setIntent(null)} onClick={()=>{setIntent(id);onChange(id);}}><span className="glass-nav-icon"><Icon size={22}/></span><span>{label}</span></button>)}</nav>;
}
