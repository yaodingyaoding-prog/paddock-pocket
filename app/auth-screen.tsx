'use client';
import { AuthRaceScene } from './auth-race-scene';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, CircleCheck, Check, CheckCircle2, CircleEllipsis, Eye, EyeOff, Flag, KeyRound, LoaderCircle, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import type { AccountAvailability } from '../lib/auth/contracts';
import { accountRequest, type AccountReply as Reply } from '../lib/account-client';
import { safeReturnPath } from '../lib/auth/paths';
import './auth.css';
import './share-poster.css';
import { AuthAtmosphere } from './auth-atmosphere';

export type AuthScreenMode = 'login' | 'register' | 'forgot' | 'confirm' | 'reset';
const copy = {
  login: { label: 'WELCOME BACK', title: '进入你的围场', subtitle: '登录围场口袋，开启比赛周末。', submit: '登录', Icon: LockKeyhole },
  register: { label: 'JOIN THE PADDOCK', title: '你的围场通行证', subtitle: '创建账号，与每一个比赛周末同行。', submit: '创建账号', Icon: UserRound },
  forgot: { label: 'ACCOUNT RECOVERY', title: '找回你的密码', subtitle: '填写注册邮箱，我们会发送重置链接。', submit: '发送重置邮件', Icon: KeyRound },
  confirm: { label: 'ONE LAST STEP', title: '确认你的邮箱', subtitle: '点击下方按钮，继续完成邮箱验证。', submit: '确认邮箱', Icon: Mail },
  reset: { label: 'A FRESH START', title: '设置新密码', subtitle: '为你的围场账号设置一个新密码。', submit: '更新密码', Icon: KeyRound },
};

function PasswordField({ label = '密码', name = 'password', confirmation = false, login = false }: { label?: string; name?: string; confirmation?: boolean; login?: boolean }) {
  const [visible, setVisible] = useState(false);
  return <label className="auth-field"><span>{label}</span><div className="auth-input-wrap"><LockKeyhole size={18} aria-hidden="true"/><input name={name} type={visible ? 'text' : 'password'} required minLength={login ? 1 : 6} maxLength={128} autoComplete={login ? 'current-password' : 'new-password'} placeholder={login ? '输入你的密码' : confirmation ? '再次输入新密码' : '至少 6 个字符'} aria-describedby={login || confirmation ? undefined : 'auth-password-help'}/><button className="auth-reveal" type="button" aria-label={visible ? '隐藏密码' : '显示密码'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>;
}

export function AuthScreen({ mode, availability }: { mode: AuthScreenMode; availability: AccountAvailability }) {
  const [status, setStatus] = useState<AccountAvailability>(availability);
  const [hydrated, setHydrated] = useState(false);
  const [statusFailed, setStatusFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [unverified, setUnverified] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [next, setNext] = useState('/#schedule');
  const [verification, setVerification] = useState<{ tokenHash: string; type: 'signup' | 'recovery' } | null>(null);
  const [invalidLink, setInvalidLink] = useState(false);
  const info = copy[mode];
  const Icon = info.Icon;
  async function loadStatus() {
    setStatusFailed(false);
    try {
      const response = await fetch('/api/auth/availability', { cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error('unavailable');
      setStatus(await response.json() as AccountAvailability);
    } catch { setStatusFailed(true); }
  }
  useEffect(() => {
    setHydrated(true);
    window.dispatchEvent(new Event('paddock:ready'));
    const params = new URLSearchParams(window.location.search);
    setNext(safeReturnPath(window.location.hash ? '/' + window.location.hash : params.get('next')));
    if (params.get('verified') === '1') setMessage('邮箱验证成功，请登录。');
    if (params.get('reset') === '1') setMessage('密码已更新，请使用新密码登录。');
    if (mode === 'confirm') {
      const hash = params.get('token_hash') || '';
      const type = params.get('type');
      if (/^[a-zA-Z0-9_-]{20,256}$/.test(hash) && (type === 'signup' || type === 'recovery')) setVerification({ tokenHash: hash, type });
      else setInvalidLink(true);
      // Keep email tokens out of subsequent history entries and copied URLs.
      window.history.replaceState(null, '', '/auth/confirm');
    }
  }, [mode]);
  useEffect(() => {
    if (cooldown < 1) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hydrated || submitting.current || busy || !status?.configured || (cooldown > 0 && (mode === 'register' || mode === 'forgot'))) return;
    submitting.current = true;
    setBusy(true); setError(''); setMessage(''); setUnverified(false);
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    try {
      if ((mode === 'register' || mode === 'reset') && password !== form.get('confirmation')) throw new Error('两次输入的密码不一致。');
      let reply: Reply;
      if (mode === 'login') reply = await accountRequest('login', { email, password, remember: form.get('remember') === 'on', next });
      else if (mode === 'register') reply = await accountRequest('register', { email, password, name: String(form.get('name') || '').trim(), next });
      else if (mode === 'forgot') reply = await accountRequest('forgot', { email });
      else if (mode === 'confirm') {
        if (!verification) throw new Error('验证链接无效，请重新发送邮件。');
        reply = await accountRequest('verify', verification);
      } else reply = await accountRequest('reset', { password });
      if (reply.next) { window.location.assign(reply.next); return; }
      setMessage(reply.message || '操作已完成。');
      if (mode === 'register' || mode === 'forgot') { setPendingEmail(email); setCooldown(60); }
    } catch (failure) {
      if (failure && typeof failure === 'object' && 'retryAfter' in failure && typeof failure.retryAfter === 'number') setCooldown(Math.min(3600, failure.retryAfter));
      setError(failure instanceof Error && failure.name !== 'TimeoutError' ? failure.message : '连接超时，请稍后重试。');
      if (failure && typeof failure === 'object' && 'code' in failure && failure.code === 'EMAIL_UNVERIFIED') { setPendingEmail(email); setUnverified(true); }
    } finally { submitting.current = false; setBusy(false); }
  }
  async function resend() {
    if (!pendingEmail || submitting.current || busy || cooldown > 0) return;
    submitting.current = true;
    setBusy(true); setError('');
    try { const reply = await accountRequest('resend', { email: pendingEmail }); setMessage(reply.message || '请检查邮箱。'); setCooldown(60); }
    catch (failure) { setError(failure instanceof Error ? failure.message : '暂时无法发送，请重试。'); if (failure && typeof failure === 'object' && 'retryAfter' in failure && typeof failure.retryAfter === 'number') setCooldown(Math.min(3600, failure.retryAfter)); }
    finally { submitting.current = false; setBusy(false); }
  }
  const ready = hydrated && Boolean(status?.configured) && !statusFailed;
  const waiting = mode === 'register' && Boolean(pendingEmail) && !error;
  const submittedForgot = mode === 'forgot' && Boolean(pendingEmail) && !error;
  return <div className="auth-shell"><AuthAtmosphere/><AuthRaceScene/><main className="auth-main"><a className="auth-mobile-brand" href="/login"><Flag size={24}/>围场口袋<span>PADDOCK POCKET</span></a><section className="auth-panel" aria-labelledby="auth-title">{mode !== 'login' && <a className="auth-back" href="/login"><ArrowLeft size={15}/>返回登录</a>}<span className="auth-panel-icon"><Icon size={23}/></span><p className="auth-kicker">{waiting ? 'CHECK YOUR INBOX' : info.label}</p><h2 id="auth-title">{waiting ? '查看你的邮箱' : info.title}</h2><p className="auth-subtitle">{waiting ? '只差一步，你的围场通行证就准备好了。' : info.subtitle}</p>{message && <div className="auth-notice auth-success" role="status"><CheckCircle2 size={18}/><span>{message}</span></div>}{error && <div className="auth-notice auth-error" role="alert">{error}</div>}{statusFailed ? <div className="auth-notice auth-preparing" role="status"><span>暂时无法连接账号服务。</span><button type="button" onClick={() => void loadStatus()}>重新连接</button></div> : status && !status.configured ? <div className="auth-notice auth-preparing" role="status"><ShieldCheck size={18}/><span>账号服务正在准备中，暂未开放注册。请稍后再来。</span></div> : null}{invalidLink ? <div className="auth-empty"><Mail size={30}/><p>验证链接无效或不完整。</p><a href="/login">返回登录，重新发送验证邮件<CircleEllipsis size={16}/></a></div> : waiting || submittedForgot ? <div className="auth-mail-state"><div className="auth-mail-illustration"><Mail size={36}/><span><Check size={15}/></span></div><strong>{pendingEmail}</strong><p>请检查收件箱与垃圾邮件。邮件到达可能需要片刻。</p>{waiting && <button className="auth-secondary" type="button" disabled={busy || cooldown > 0} onClick={() => void resend()}>{cooldown ? `${cooldown} 秒后可重新发送` : '重新发送验证邮件'}</button>}<a className="auth-inline-link" href={waiting ? '/register' : '/forgot-password'}>换一个邮箱</a><a className="auth-primary auth-link-button" href="/login">返回登录<CircleCheck size={18}/></a></div> : <form className="auth-form" method="post" onSubmit={submit}>{mode === 'register' && <label className="auth-field"><span>昵称</span><div className="auth-input-wrap"><UserRound size={18} aria-hidden="true"/><input name="name" type="text" required maxLength={30} autoComplete="nickname" placeholder="怎么称呼你"/></div></label>}{['login', 'register', 'forgot'].includes(mode) && <label className="auth-field"><span>邮箱</span><div className="auth-input-wrap"><Mail size={18} aria-hidden="true"/><input name="email" type="email" required maxLength={254} autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} placeholder="you@example.com"/></div></label>}{['login', 'register', 'reset'].includes(mode) && <PasswordField login={mode === 'login'} label={mode === 'reset' ? '新密码' : '密码'}/ >}{(mode === 'register' || mode === 'reset') && <><p className="auth-password-help" id="auth-password-help">至少 6 个字符，支持浏览器生成和保存密码。</p><PasswordField label="确认密码" name="confirmation" confirmation/></>}{mode === 'login' && <div className="auth-form-options"><label><input name="remember" type="checkbox" defaultChecked/>保持登录</label><a href="/forgot-password">忘记密码？</a></div>}{mode === 'confirm' && <div className="auth-confirm-detail"><ShieldCheck size={21}/><p>{verification?.type === 'recovery' ? '确认邮箱后，即可设置新密码。' : '确认后即可使用邮箱与密码登录。'}</p></div>}<button className="auth-primary" disabled={!ready || busy || (cooldown > 0 && (mode === 'register' || mode === 'forgot' || mode === 'login')) || (mode === 'confirm' && !verification)} type="submit">{busy ? <><LoaderCircle className="auth-spinner" size={19}/>正在处理</> : <>{cooldown > 0 ? `${cooldown} 秒后可重试` : info.submit}<CircleCheck size={19}/></>}</button>{mode === 'login' && unverified && <button className="auth-secondary" type="button" disabled={busy || cooldown > 0} onClick={() => void resend()}>{cooldown ? `${cooldown} 秒后可重新发送` : '重新发送验证邮件'}</button>}</form>}{mode === 'login' && <p className="auth-switch">还没有账号？<a href={'/register?next=' + encodeURIComponent(next)}>创建账号<CircleEllipsis size={15}/></a></p>}{mode === 'register' && !waiting && <p className="auth-switch">已经加入围场？<a href="/login">直接登录<CircleEllipsis size={15}/></a></p>}<a className="guest-entry-link" href="/#schedule"><Flag size={15}/>先以游客浏览</a><p className="auth-privacy"><ShieldCheck size={14}/>账号仅用于围场口袋 · <a href="/privacy">隐私说明</a></p></section><footer className="auth-footer"><span>围场口袋 · PADDOCK POCKET</span><small>独立 F1 赛事与观赛工具</small></footer></main></div>;
}
