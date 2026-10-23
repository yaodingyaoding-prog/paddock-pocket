'use client';
import { useEffect, useState } from 'react';
import { Copy, Download, LoaderCircle, Share2 } from 'lucide-react';
import { Dialog } from './dialog';
import type { ShareCard } from '../lib/share-card';
import './share-poster.css';

export function SharePosterDialog({ card, close }: { card: ShareCard; close: () => void }) {
  const [preview, setPreview] = useState(''), [blob, setBlob] = useState<Blob | null>(null), [notice, setNotice] = useState(''), [error, setError] = useState(''), [sharing, setSharing] = useState(false), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true, objectUrl = ''; setError(''); setPreview(''); setBlob(null);
    import('../lib/share-poster').then(module => module.renderSharePoster(card)).then(result => {
      if (!active) return; objectUrl = URL.createObjectURL(result); setBlob(result); setPreview(objectUrl);
    }).catch(() => { if (active) setError('图片暂时无法生成，仍可复制链接。'); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [card, attempt]);
  async function copy() {
    try { await navigator.clipboard.writeText(card.url); setNotice('链接已复制'); } catch { setNotice('请长按下方链接复制'); }
  }
  async function share() {
    if (!blob || sharing) return;
    const file = new File([blob], 'Paddock-Pocket-' + card.kind + '.png', { type: 'image/png' });
    if (!navigator.canShare?.({ files: [file] }) || !navigator.share) { setNotice('此浏览器不支持分享图片，请保存海报后发送。'); return; }
    setSharing(true);
    try { await navigator.share({ files: [file], title: '围场口袋 · ' + card.title }); }
    catch (failure) { if (!(failure instanceof Error && failure.name === 'AbortError')) setNotice('未能打开系统分享，请保存图片后发送。'); }
    finally { setSharing(false); }
  }
  return <Dialog title={card.kind === 'weekend' ? '分享比赛周末' : '分享领奖台'} close={close}><div className="share-poster-dialog">
    <div className="share-poster-preview">{preview ? <img src={preview} alt={card.title + '分享海报，包含赛程或阵容和网站二维码'}/> : <div role="status">{error ? <><p>{error}</p><button className="small-button" onClick={() => setAttempt(n => n + 1)}>重新生成</button></> : <><LoaderCircle className="auth-spinner" size={24}/><p>正在制作海报…</p></>}</div>}</div>
    <div className="share-poster-actions"><button className="small-button" onClick={() => void share()} disabled={!blob || sharing}><Share2 size={16}/>{sharing ? '正在分享' : '分享图片'}</button>{preview && <a className="small-button" href={preview} download={'Paddock-Pocket-' + card.kind + '.png'}><Download size={16}/>保存海报</a>}<button className="small-button" onClick={() => void copy()}><Copy size={16}/>复制链接</button></div>
    {notice && <p className="share-poster-notice" role="status">{notice}</p>}<a className="share-poster-url" href={card.url} title={card.url}>分享链接 · F1.xiaodinglab.com</a><p className="section-note">海报在当前设备生成。可长按图片保存；预报、赛程以站内最新数据为准。</p>
  </div></Dialog>;
}
