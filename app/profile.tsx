'use client';

import { useState, type CSSProperties } from 'react';
import { ArrowUpRight, Check, ChevronRight, Clapperboard, Clock3, Download, Flag, Heart, LogOut, Palette, Play, ShieldCheck, Smartphone, Sparkles, UserRound, Watch } from 'lucide-react';
import { appearanceThemes, accentColors } from './paddock-navigation';
import { Dialog } from './dialog';
import { portraitFor } from '../lib/portrait';
import type { useAccountControls } from './account-controls';
import './profile.css';

type Driver = Record<string, any>;
type ProfileProps = {
  account: ReturnType<typeof useAccountControls>;
  theme: string; accent: string; timezone: string; localTimezone: string;
  drivers: Driver[]; favoriteDriver?: Driver; loadingDrivers: boolean;
  onTheme: (value: string) => void; onAccent: (value: string) => void; onTimezone: (value: string) => void;
  onPickDriver: (driver: Driver) => void; onOpenDriver: (driver: Driver) => void;
  onReplay: () => void; onViewing: () => void; onWidgets: () => void; onInstall: () => void;
};

function Portrait({ driver }: { driver: Driver }) {
  const portrait = portraitFor(driver);
  const [failed, setFailed] = useState(false);
  return portrait && !failed ? <img key={portrait.file} src={portrait.file} alt={driver.driverName + '的头像'} loading="lazy" onError={() => setFailed(true)}/> : <UserRound aria-label="头像暂缺"/>;
}

export function ProfilePage(props: ProfileProps) {
  const { account, theme, accent, timezone, localTimezone, favoriteDriver, drivers } = props;
  const [choosingDriver, setChoosingDriver] = useState(false);
  const user = account.status?.user;
  const accentName = accentColors.find(item => item[0] === accent)?.[1] || '薄荷绿';
  const driverColor = favoriteDriver && /^[a-f0-9]{6}$/i.test(favoriteDriver.teamColor || '') ? '#' + favoriteDriver.teamColor : 'var(--accent)';
  const showName = user?.name || (account.status ? '围场车迷' : '正在读取账号');

  return <div className="personal-center">
    <div className="personal-top-grid">
      <section className="paddock-pass" aria-label="我的账号">
        <div className="pass-top"><span><Flag size={15}/> PADDOCK PASS</span><span className={'pass-status' + (user ? ' is-verified' : '')}>{user ? <><ShieldCheck size={13}/>邮箱已验证</> : 'MY PADDOCK'}</span></div>
        <div className="pass-identity"><div className="pass-avatar" aria-hidden="true">{user ? Array.from(user.name || '围')[0].toUpperCase() : <UserRound size={29}/>}</div><div><p>欢迎回到围场</p><h2>{showName}</h2><span>{user?.email || (account.status ? '每个比赛周末，都有你的主场' : '正在连接账号服务…')}</span></div></div>
        <div className="pass-bottom"><span>YOUR WEEKEND. YOUR PADDOCK.</span><span className="pass-bars" aria-hidden="true"/></div>
        <svg className="pass-circuit" viewBox="0 0 360 200" fill="none" aria-hidden="true"><path d="m34 142 31-48 46 9 29-53 52 8 23-24 58 21 25 43-20 26 24 26-34 26-45-15-24 12-31-35-26 33-34-10-24 21-35-10Z"/></svg>
      </section>
      <section className={'personal-driver' + (favoriteDriver ? ' has-driver' : '')} style={{ '--driver-color': driverColor } as CSSProperties} aria-label="我的车手">
        <div className="personal-driver-top"><span><Heart size={15}/>我的车手</span><button onClick={() => setChoosingDriver(true)}>{favoriteDriver ? '更换' : '选择车手'}<ChevronRight size={14}/></button></div>
        {favoriteDriver ? <button className="personal-driver-body" onClick={() => props.onOpenDriver(favoriteDriver)} aria-label={'查看' + favoriteDriver.driverName}><div><span className="personal-driver-team">{favoriteDriver.teamShortName || favoriteDriver.teamName}</span><h2>{favoriteDriver.driverName}</h2><span className="personal-driver-result">P{favoriteDriver.position || '—'}<i/>{favoriteDriver.points ?? '—'} 积分</span></div><span className="personal-driver-portrait"><Portrait key={favoriteDriver.driverId} driver={favoriteDriver}/></span><ArrowUpRight className="personal-driver-arrow" size={18}/></button> : <button className="personal-driver-empty" onClick={() => setChoosingDriver(true)}><span className="personal-driver-heart"><Heart size={26}/></span><strong>为你的车手，留一个位置</strong><span>选择关注，随时查看赛季表现</span></button>}
      </section>
    </div>

    <div className="personal-shortcuts" aria-label="常用入口">
      <button className="personal-shortcut shortcut-orange" onClick={props.onReplay}><span className="shortcut-symbol"><Clapperboard size={21}/></span><span><strong>赛事回放</strong><small>重温每一个精彩时刻</small></span><ArrowUpRight size={17}/></button>
      <button className="personal-shortcut shortcut-purple" onClick={props.onViewing}><span className="shortcut-symbol"><Play size={21}/></span><span><strong>观赛中心</strong><small>准备好，下一个比赛周末</small></span><ArrowUpRight size={17}/></button>
      <button className="personal-shortcut shortcut-blue" onClick={props.onWidgets}><span className="shortcut-symbol"><Watch size={21}/></span><span><strong>赛事速览</strong><small>赛程、天气与手表指南</small></span><ArrowUpRight size={17}/></button>
    </div>

    <div className="personal-settings-grid">
      <section className="personal-panel appearance-panel" aria-labelledby="personal-appearance-title">
        <div className="personal-panel-heading"><span className="personal-heading-icon"><Palette size={19}/></span><div><h2 id="personal-appearance-title">让围场，更像你</h2><p>选择你的外观与主题色</p></div><Sparkles size={18}/></div>
        <div className="personal-option-heading"><h3>界面外观</h3><span>{appearanceThemes.find(item => item[0] === theme)?.[1]}</span></div>
        <div className="personal-themes" role="group" aria-label="界面外观">{appearanceThemes.map(([id, label, tint]) => <button key={id} className={'personal-theme' + (theme === id ? ' is-selected' : '')} aria-pressed={theme === id} onClick={() => props.onTheme(id)} style={{ '--preview-bg': tint, '--preview-ink': id === 'light' ? '#566779' : '#d9e4e7', '--preview-panel': id === 'light' ? '#fff' : '#ffffff0d' } as CSSProperties}><span className="theme-preview" aria-hidden="true"><span className="theme-preview-bar"><i/><i/><i/></span><span className="theme-preview-layout"><i/><span><b/><b/><em/><b/></span></span></span><span className="theme-label">{label}<span className="theme-check">{theme === id && <Check size={12}/>}</span></span></button>)}</div>
        <div className="personal-accent-section"><div className="personal-option-heading"><h3>点缀色</h3><span>{accentName}</span></div><div className="personal-accents" role="group" aria-label="点缀色">{accentColors.map(([id,label,tint]) => <button key={id} aria-label={label} title={label} aria-pressed={accent === id} onClick={() => props.onAccent(id)} style={{ '--choice-color': tint } as CSSProperties}><span>{accent === id && <Check size={17}/>}</span><small>{label.slice(0,2)}</small></button>)}</div></div>
        <div className="personal-local-note"><Smartphone size={13}/>外观与关注偏好保存在当前设备</div>
      </section>

      <div className="personal-settings-stack">
        <section className="personal-panel personal-utilities" aria-labelledby="personal-settings-title"><div className="personal-panel-heading"><h2 id="personal-settings-title">使用偏好</h2></div>
          <div className="personal-settings-row"><span className="personal-row-icon"><Clock3 size={19}/></span><label htmlFor="personal-timezone">时间显示<small>赛程与日历时区</small></label><select id="personal-timezone" aria-label="偏好时区" value={timezone} onChange={event => props.onTimezone(event.target.value)}><option value="Asia/Shanghai">北京时间</option>{!['Asia/Shanghai','UTC'].includes(localTimezone) && <option value={localTimezone}>设备时间</option>}<option value="UTC">UTC</option></select></div>
          <button className="personal-settings-row" onClick={props.onInstall}><span className="personal-row-icon blue"><Download size={19}/></span><span>添加到主屏幕<small>让围场触手可及</small></span><ChevronRight size={17}/></button>
        </section>
        <section className="personal-panel personal-account-panel" aria-labelledby="personal-account-title"><div className="personal-panel-heading"><h2 id="personal-account-title">账号与安全</h2><ShieldCheck size={17}/></div><a className="personal-settings-row" href="/forgot-password"><span className="personal-row-icon purple"><ShieldCheck size={19}/></span><span>重置密码<small>通过邮箱验证身份</small></span><ChevronRight size={17}/></a><a className="personal-settings-row" href="/privacy"><span className="personal-row-icon"><UserRound size={19}/></span><span>隐私说明</span><ChevronRight size={17}/></a>{account.error && <p className="personal-account-error" role="alert">{account.error}</p>}{user ? <button className="personal-logout" disabled={account.busy} onClick={() => void account.logout()}><LogOut size={16}/>{account.busy ? '正在退出…' : '退出登录'}</button> : account.status?.configured ? <a className="personal-logout" href="/login">登录账号<ChevronRight size={16}/></a> : null}</section>
      </div>
    </div>

    <footer className="personal-about"><div className="personal-about-brand"><img src="/favicon.svg" alt=""/><div><strong>围场口袋</strong><span>每个比赛周末，与你同在。</span></div></div><details className="personal-sources"><summary>数据来源与许可<ChevronRight size={14}/></summary><div><p>赛事与遥测来自公开赛事服务。无法更新时显示最近保存的数据及其时间。</p><a href="/drivers/credits.json" target="_blank" rel="noopener noreferrer">当前车手图片<ArrowUpRight size={12}/></a><a href="/drivers/history/credits.json" target="_blank" rel="noopener noreferrer">历史车手图片<ArrowUpRight size={12}/></a><a href="/circuits/models/credits.json" target="_blank" rel="noopener noreferrer">赛道坐标与模型<ArrowUpRight size={12}/></a></div></details></footer>

    {choosingDriver && <Dialog title="选择关注的车手" close={() => setChoosingDriver(false)}><div className="personal-driver-picker">{drivers.map(driver => <button key={driver.driverId} aria-pressed={driver.driverId === favoriteDriver?.driverId} onClick={() => { if (driver.driverId !== favoriteDriver?.driverId) props.onPickDriver(driver); setChoosingDriver(false); }}><span className="picker-portrait"><Portrait driver={driver}/></span><span><strong>{driver.driverName}</strong><small>{driver.teamShortName || driver.teamName}</small></span>{driver.driverId === favoriteDriver?.driverId ? <Check size={18}/> : <Heart size={16}/>}</button>)}</div>{!drivers.length && <p className="personal-picker-empty" role="status">{props.loadingDrivers ? '正在读取车手名单…' : '暂时无法读取车手名单，请关闭后点击页面顶部刷新重试。'}</p>}{favoriteDriver && <button className="personal-unfollow" onClick={() => { props.onPickDriver(favoriteDriver); setChoosingDriver(false); }}>取消关注{favoriteDriver.driverName}</button>}</Dialog>}
  </div>;
}
