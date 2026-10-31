'use client';
import type { CSSProperties } from 'react';

import { CodeXml, Star, CircleEllipsis, Check, Clock3, Cloud, Download, Flag, LogOut, Palette, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import type { useAccountPreferences } from './account-preferences';
import { appearanceThemes, accentColors } from './paddock-navigation';
import { AvatarEditor } from './avatar-editor';
import { TimezonePicker } from './timezone-picker';
import type { useAccountControls } from './account-controls';
import './profile.css';
import { FollowPodium } from './following';
import type { Following } from '../lib/following';

type Driver = Record<string, any>;
type ProfileProps = {
  account: ReturnType<typeof useAccountControls>;
  sync: ReturnType<typeof useAccountPreferences>;
  drivers: Driver[]; teams: Driver[]; following: Following; loadingDrivers: boolean;
  onPickDriver:(driver:Driver)=>void;onPickTeam:(team:Driver)=>void;onOpenDriver:(driver:Driver)=>void;
  theme: string; accent: string; timezone: string; localTimezone: string;
  onTheme: (value: string) => void; onAccent: (value: string) => void; onTimezone: (value: string) => void;
  onInstall: () => void; onSharePodium: () => void;
};

export function ProfilePage(props: ProfileProps) {
  const { account, theme, accent, timezone, localTimezone } = props;
  const user = account.status?.user;
  const accentName = accentColors.find(item => item[0] === accent)?.[1] || '薄荷绿';
  const showName = user?.name || (account.status ? '围场车迷' : '正在读取账号');

  return <div className="personal-center">
    <div className="profile-identity-grid">{!user ? <section className="guest-pass" aria-label="游客账号入口"><h2>先逛围场，随时加入。</h2><p>赛程、天气和回放无需登录。登录后设置专属头像，领取你的车迷通行证。</p><div className="guest-pass-actions"><a href="/login?next=%2F%23profile">登录账号</a><a href="/register?next=%2F%23profile">创建账号</a></div></section> : <section className="super-licence" aria-label="我的超级执照式车迷通行证"><div className="licence-top"><span><Flag size={19}/>围场口袋 <small>PADDOCK POCKET</small></span><span className="licence-class">FAN PASS</span></div><div className="licence-body"><div className="licence-photo"><AvatarEditor user={user} onSaved={account.updateUser}/><span>点击设置头像</span></div><div className="licence-identity"><p className="licence-type">FAN SUPER LICENCE</p><h2>{showName}</h2><span className="licence-email">{user?.email || '正在连接账号服务…'}</span><div className="licence-data"><div><small>MEMBER ID</small><strong>{user ? user.id.replace(/-/g,'').slice(0,10).toUpperCase() : '••••••••••'}</strong></div><div><small>STATUS</small><strong>{user ? 'ACTIVE' : 'PADDOCK FAN'}</strong></div></div></div><span className="licence-monogram" aria-hidden="true">SL<span>SUPER<br/>LICENCE</span></span></div><div className="licence-bottom"><span>每个比赛周末，都是你的主场。<small>围场口袋 · 车迷通行证</small></span><span className="licence-bars" aria-hidden="true"/><ShieldCheck size={22}/></div></section>}

    <FollowPodium onShare={props.onSharePodium} drivers={props.drivers} teams={props.teams} following={props.following} onDriver={props.onPickDriver} onTeam={props.onPickTeam} onOpen={props.onOpenDriver} loading={props.loadingDrivers}/></div>
    <div className="personal-settings-grid">
      <section className="personal-panel appearance-panel" aria-labelledby="personal-appearance-title">
        <div className="personal-panel-heading"><span className="personal-heading-icon"><Palette size={19}/></span><div><h2 id="personal-appearance-title">让围场，更像你</h2><p>选择你的外观与主题色</p></div><Sparkles size={18}/></div>
        <div className="personal-option-heading"><h3>界面外观</h3><span>{appearanceThemes.find(item => item[0] === theme)?.[1]}</span></div>
        <div className="personal-themes" role="group" aria-label="界面外观">{appearanceThemes.map(([id, label, tint]) => <button key={id} className={'personal-theme' + (theme === id ? ' is-selected' : '')} aria-pressed={theme === id} onClick={() => props.onTheme(id)} style={{ '--preview-bg': tint, '--preview-ink': id === 'light' ? '#566779' : '#d9e4e7', '--preview-panel': id === 'light' ? '#fff' : '#ffffff0d' } as CSSProperties}><span className="theme-preview" aria-hidden="true"><span className="theme-preview-bar"><i/><i/><i/></span><span className="theme-preview-layout"><i/><span><b/><b/><em/><b/></span></span></span><span className="theme-label">{label}<span className="theme-check">{theme === id && <Check size={12}/>}</span></span></button>)}</div>
        <div className="personal-accent-section"><div className="personal-option-heading"><h3>点缀色</h3><span>{accentName}</span></div><div className="personal-accents" role="group" aria-label="点缀色">{accentColors.map(([id,label,tint]) => <button key={id} aria-label={label} title={label} aria-pressed={accent === id} onClick={() => props.onAccent(id)} style={{ '--choice-color': tint } as CSSProperties}><span>{accent === id && <Check size={17}/>}</span><small>{label.slice(0,2)}</small></button>)}</div></div>
        {user && ['loading','saving','error'].includes(props.sync.status) && <div className="personal-sync-note" data-status={props.sync.status} role="status"><Cloud size={14}/><span>{props.sync.status === 'loading' ? '正在加载…' : props.sync.status === 'saving' ? '正在保存…' : props.sync.error}</span>{props.sync.status === 'error' && <button onClick={() => void props.sync.retry().catch(() => {})}>重试</button>}</div>}
      </section>

      <div className="personal-settings-stack">
        <section className="personal-panel personal-utilities" aria-labelledby="personal-settings-title"><div className="personal-panel-heading"><h2 id="personal-settings-title">使用偏好</h2></div>
          <div className="personal-settings-row"><span className="personal-row-icon"><Clock3 size={19}/></span><span>时间显示</span><TimezonePicker value={timezone} localTimezone={localTimezone} onChange={props.onTimezone}/></div>
          <button className="personal-settings-row" onClick={props.onInstall}><span className="personal-row-icon blue"><Download size={19}/></span><span>添加到主屏幕</span><CircleEllipsis size={17}/></button>
        </section>
        <section className="personal-panel personal-account-panel" aria-labelledby="personal-account-title"><div className="personal-panel-heading"><h2 id="personal-account-title">账号与安全</h2><ShieldCheck size={17}/></div><a className="personal-settings-row" href="/forgot-password"><span className="personal-row-icon purple"><ShieldCheck size={19}/></span><span>重置密码</span><CircleEllipsis size={17}/></a><a className="personal-settings-row" href="/privacy"><span className="personal-row-icon"><UserRound size={19}/></span><span>隐私说明</span><CircleEllipsis size={17}/></a>{account.error && <p className="personal-account-error" role="alert">{account.error}</p>}{user ? <button className="personal-logout" disabled={account.busy} onClick={() => void account.logout()}><LogOut size={16}/>{account.busy ? '正在退出…' : '退出登录'}</button> : account.status?.configured ? <a className="personal-logout" href="/login">登录账号<CircleEllipsis size={16}/></a> : null}</section>
      </div>
    </div>

    <footer className="personal-about"><div className="personal-about-brand"><img src="/favicon.svg" alt=""/><div><strong>围场口袋</strong><span>每个比赛周末，与你同在。</span></div></div><a className="github-star" href="https://github.com/yaodingyaoding-prog/paddock-pocket" target="_blank" rel="noopener noreferrer" aria-label="在 GitHub 查看项目并点 Star"><CodeXml size={17}/><span>GitHub</span><Star size={14}/></a><a className="profile-about-link" href="/about">关于围场口袋</a></footer>


  </div>;
}
