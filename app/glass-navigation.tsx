'use client';
import { CalendarDays, Compass, Trophy, UserRound } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { NavTab } from './paddock-navigation';
import './glass-navigation.css';
const items = [{ id: 'schedule', label: '赛程', Icon: CalendarDays }, { id: 'rankings', label: '积分', Icon: Trophy }, { id: 'discover', label: '探索', Icon: Compass }, { id: 'profile', label: '我的', Icon: UserRound }] as const;
export function GlassNavigation({ tab, onChange }: { tab: NavTab; onChange: (tab: NavTab) => void }) {
 const index = Math.max(0, items.findIndex(item => item.id === (tab === 'widgets' ? 'profile' : tab)));
 return <nav className="bottom-nav liquid-nav" aria-label="底部导航" style={{ '--nav-index': index } as CSSProperties}><span className="glass-lens" aria-hidden="true"><span className="glass-liquid" key={tab}/></span>{items.map(({id,label,Icon})=><button key={id} className={tab===id?'active':''} aria-current={tab===id?'page':undefined} onClick={()=>onChange(id)}><span className="glass-nav-icon" key={tab===id?'selected':'idle'}><Icon size={22}/></span><span>{label}</span></button>)}</nav>;
}
