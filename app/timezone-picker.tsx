'use client';
import { useMemo, useState } from 'react';
import { Check, ChevronDown, Search, Smartphone } from 'lucide-react';
import { availableTimezones, timezoneLabel, timezoneOffset } from '../lib/timezones';
import { Dialog } from './dialog';
import './timezone-picker.css';

export function TimezonePicker({ value, localTimezone, onChange, label = '偏好时区' }: { value: string; localTimezone: string; onChange: (zone: string) => void; label?: string }) {
  const [open, setOpen] = useState(false), [query, setQuery] = useState(''), [limit, setLimit] = useState(60);
  const zones = useMemo(() => availableTimezones(localTimezone), [localTimezone]);
  const options = useMemo(() => zones.map(zone => ({ zone, name: timezoneLabel(zone), offset: timezoneOffset(zone) })), [zones]);
  const filtered = options.filter(item => (item.zone + ' ' + item.name + ' ' + item.offset).toLowerCase().includes(query.trim().toLowerCase()));
  function choose(zone: string) { onChange(zone); setOpen(false); }
  return <><button className="timezone-trigger" type="button" aria-label={label} aria-haspopup="dialog" onClick={() => { setQuery(''); setLimit(60); setOpen(true); }}><span>{timezoneLabel(value)}</span><ChevronDown size={14}/></button>{open && <Dialog title="选择显示时区" close={() => setOpen(false)}><div className="timezone-picker"><label className="timezone-search"><Search size={17}/><input type="search" value={query} placeholder="搜索城市、时区或 UTC 偏移" aria-label="搜索时区" autoComplete="off" onChange={event => { setQuery(event.target.value); setLimit(60); }}/></label><button className="timezone-device" onClick={() => choose(localTimezone)}><Smartphone size={18}/><span><strong>使用设备当前时区</strong><small>{localTimezone}</small></span><b>{timezoneOffset(localTimezone)}</b></button><p className="timezone-count">{filtered.length} 个时区 · 自动处理夏令时</p><div className="timezone-options" role="group" aria-label="可选时区">{filtered.slice(0, limit).map(({zone,name,offset}) => <button key={zone} aria-pressed={zone === value} onClick={() => choose(zone)}><span><strong>{name}</strong><small>{zone}</small></span><b>{offset}</b>{zone === value && <Check size={17}/>}</button>)}</div>{!filtered.length && <p className="timezone-empty">没有匹配的时区，可以尝试英文城市名或 Asia / Europe / America。</p>}{filtered.length > limit && <button className="timezone-more" onClick={() => setLimit(limit + 80)}>显示更多时区</button>}</div></Dialog>}</>;
}
