'use client';
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Camera, ImagePlus, LoaderCircle, Minus, Plus, RotateCcw } from 'lucide-react';
import type { AccountUser } from '../lib/auth/contracts';
import { avatarCrop } from '../lib/avatar-crop';
import { encodeAvatar } from '../lib/avatar-encoder';
import { Dialog } from './dialog';
import './avatar-editor.css';

export function AvatarEditor({ user, onSaved }: { user?: AccountUser | null; onSaved: (user: AccountUser) => void }) {
  const [open, setOpen] = useState(false), [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [user?.avatarUrl]);
  return <><button className="pass-avatar editable-avatar" aria-label="设置头像" disabled={!user} onClick={() => setOpen(true)}>{user?.avatarUrl && !failed ? <img src={user.avatarUrl} alt="我的头像" onError={() => setFailed(true)}/> : user ? Array.from(user.name || '围')[0].toUpperCase() : '围'}<span><Camera size={12}/></span></button>{open && user && <AvatarDialog user={user} close={() => setOpen(false)} onSaved={onSaved}/>}</>;
}

function AvatarDialog({ user, close, onSaved }: { user: AccountUser; close: () => void; onSaved: (user: AccountUser) => void }) {
  const input = useRef<HTMLInputElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ x: number; y: number; cropX: number; cropY: number } | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [source, setSource] = useState(''), [zoom, setZoom] = useState(1), [x, setX] = useState(.5), [y, setY] = useState(.5);
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [loading, setLoading] = useState(false);
  const selection = useRef(0);
  useEffect(() => () => { selection.current++; }, []);
  useEffect(() => () => { if (source) URL.revokeObjectURL(source); }, [source]);
  useEffect(() => {
    if (!image || !canvas.current) return;
    const context = canvas.current.getContext('2d', { colorSpace: 'srgb' }); if (!context) return;
    const { side, sx, sy } = avatarCrop(image.naturalWidth, image.naturalHeight, zoom, x, y);
    context.fillStyle = '#edf2f1'; context.fillRect(0, 0, 256, 256);
    context.drawImage(image, sx, sy, side, side, 0, 0, 256, 256);
  }, [image, zoom, x, y]);
  async function select(file?: File) {
    if (!file) return;
    const version = ++selection.current;
    setError('');
    if (!['image/jpeg','image/png','image/webp','image/heic','image/heif'].includes(file.type)) { setError('请选择 JPG、PNG、WebP 或设备支持的 HEIC 图片。'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('原图请控制在 10 MB 以内。'); return; }
    const url = URL.createObjectURL(file), next = new Image();
    setLoading(true);
    try {
      next.src = url; await next.decode();
      if (version !== selection.current) { URL.revokeObjectURL(url); return; }
      if (!next.naturalWidth || next.naturalWidth * next.naturalHeight > 40000000) throw new Error('图片分辨率过大，请先缩小图片。');
      setSource(url); setImage(next); setZoom(1); setX(.5); setY(.5);
    } catch (failure) { URL.revokeObjectURL(url); if (version === selection.current) setError(failure instanceof Error && failure.message.includes('分辨率') ? failure.message : '这张图片无法读取，请转换成 JPG 或 PNG 后重试。'); }
    finally { if (version === selection.current) setLoading(false); }
  }
  function pointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (!image) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, cropX: x, cropY: y };
  }
  function pointerMove(event: PointerEvent<HTMLCanvasElement>) {
    if (!drag.current || !image) return;
    const { side } = avatarCrop(image.naturalWidth, image.naturalHeight, zoom, x, y);
    const ratio = side / event.currentTarget.getBoundingClientRect().width;
    if (image.naturalWidth > side) setX(Math.max(0, Math.min(1, drag.current.cropX - (event.clientX - drag.current.x) * ratio / (image.naturalWidth - side))));
    if (image.naturalHeight > side) setY(Math.max(0, Math.min(1, drag.current.cropY - (event.clientY - drag.current.y) * ratio / (image.naturalHeight - side))));
  }
  async function save(remove = false) {
    if (busy || loading) return;
    setBusy(true); setError('');
    try {
      let blob: Blob | null = null;
      if (!remove) {
        if (!image || !canvas.current) throw new Error('请先选择图片。');
        blob = await encodeAvatar(canvas.current);
      }
      const response = await fetch('/api/auth/avatar', { method: remove ? 'DELETE' : 'POST', headers: remove ? undefined : { 'Content-Type': 'image/webp' }, body: blob, credentials: 'same-origin', signal: AbortSignal.timeout(30000) });
      const value = await response.json() as { user?: AccountUser; error?: string };
      if (!response.ok || !value.user) throw new Error(value.error || '头像暂时无法保存，请重试。');
      onSaved(value.user); close();
    } catch (failure) { setError(failure instanceof Error && failure.name !== 'TimeoutError' ? failure.message : '保存超时，请稍后重试。'); }
    finally { setBusy(false); }
  }
  return <Dialog title="设置头像" close={close}><div className="avatar-editor"><p className="avatar-editor-intro">选一张喜欢的图片，作为你的围场头像。</p><input className="sr-only" ref={input} type="file" aria-label="选择头像图片" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" disabled={busy} onChange={event => { void select(event.target.files?.[0]); event.target.value = ''; }}/><div className="avatar-crop-stage">{image ? <><canvas width={256} height={256} ref={canvas} aria-label="头像裁剪预览" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}/><div className="avatar-crop-mask" aria-hidden="true"/></> : user.avatarUrl ? <img src={user.avatarUrl} alt="当前头像"/> : <span className="avatar-editor-initial">{Array.from(user.name || '围')[0].toUpperCase()}</span>}{loading && <span className="avatar-loading"><LoaderCircle size={24}/></span>}</div><p className="avatar-crop-help">{image ? '拖动图片调整位置，也可使用下方位置滑块' : '支持相册选图，上传前可裁剪预览'}</p>{image && <div className="avatar-crop-controls"><label><span>缩放</span><Minus size={13}/><input type="range" min={1} max={3} step={.02} aria-label="头像缩放" value={zoom} onChange={event => setZoom(Number(event.target.value))}/><Plus size={13}/></label><label><span>左右</span><input type="range" min={0} max={1} step={.01} aria-label="头像水平位置" value={x} onChange={event => setX(Number(event.target.value))}/></label><label><span>上下</span><input type="range" min={0} max={1} step={.01} aria-label="头像垂直位置" value={y} onChange={event => setY(Number(event.target.value))}/></label></div>}{error && <p className="avatar-editor-error" role="alert">{error}</p>}<div className="avatar-editor-actions"><button className="avatar-select" disabled={busy || loading} onClick={() => input.current?.click()}><ImagePlus size={17}/>{image ? '重新选图' : '从相册选择'}</button><button className="avatar-save" disabled={!image || busy || loading} onClick={() => void save()}>{busy ? <LoaderCircle size={17}/> : <CheckIcon/>}保存头像</button></div>{user.avatarUrl && <button className="avatar-restore" disabled={busy} onClick={() => void save(true)}><RotateCcw size={14}/>恢复默认头像</button>}<p className="avatar-privacy-note">保存后随账号同步。仅上传裁剪后的头像，不保留原图及位置元数据。</p></div></Dialog>;
}
function CheckIcon() { return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m5 12 4 4 10-10"/></svg>; }
