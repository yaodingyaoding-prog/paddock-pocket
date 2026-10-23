'use client';
import {useEffect,useState} from 'react';
import { Play, Link2, Smartphone, Monitor, Clapperboard, CircleEllipsis } from 'lucide-react';
import {ScriptGuide} from './script-install-guide';
import {detectViewingPlatform,nativeAndroidAvailable,tencentAppLink} from '../lib/viewing';
export function ViewingRoom({onReplay}:{onReplay?:()=>void}){
 const [embed,setEmbed]=useState(false),[native,setNative]=useState(false),[mobile,setMobile]=useState(false),[appHint,setAppHint]=useState(false);
 useEffect(()=>{setNative(nativeAndroidAvailable());setMobile(detectViewingPlatform(navigator.userAgent,navigator.platform,navigator.maxTouchPoints)!=='windows');},[]);
 function openTencent(){if(native){window.dispatchEvent(new Event('paddock:open-tencent'));return;}setAppHint(true);window.location.href=tencentAppLink;}
 return <section className="card viewing-room"><div className="panel-title"><div><p className="eyebrow">WATCH LIVE</p><h2>直播平台</h2></div><Play size={23}/></div>
 <div className="viewing-channel-grid"><article className="viewing-channel tone-orange"><span className="section-icon"><Play size={22}/></span><h3>五星体育</h3><p>看看新闻 · 直播与回看</p>{native?<button className="channel-action" onClick={()=>window.dispatchEvent(new Event('paddock:open-smg'))}>App 内观看 <Play size={16}/></button>:<a className="channel-action" href="https://live.kankanews.com/huikan?id=10" target="_blank" rel="noopener noreferrer">打开直播 <Link2 size={16}/></a>}</article>
 <article className="viewing-channel tone-blue"><span className="section-icon"><Monitor size={22}/></span><h3>腾讯视频</h3><p>浏览器观看</p><a className="channel-action" href="https://v.qq.com/" target="_blank" rel="noopener noreferrer">打开网页版 <Link2 size={16}/></a></article>
 <article className="viewing-channel tone-purple"><span className="section-icon"><Smartphone size={22}/></span><h3>腾讯视频 App</h3><p>{mobile||native?'使用已安装的腾讯视频':'手机与平板适用'}</p><button className="channel-action" onClick={openTencent}>打开 App <Smartphone size={16}/></button></article></div>
 {appHint&&<p className="viewing-note" role="status">若未打开 App，请使用网页版。</p>}
 {onReplay&&<button className="replay-library-link" onClick={onReplay}><Clapperboard size={23}/><span><strong>赛事回放</strong><small>按赛季与分站查找比赛</small></span><CircleEllipsis size={19}/></button>}
 <ScriptGuide/><details className="plain-embed"><summary>内嵌播放器</summary><button className="small-button" onClick={()=>setEmbed(!embed)}>{embed?'关闭播放器':'载入播放器'}</button>{embed&&<iframe className="live-frame" title="看看新闻播放器" src="https://live.kankanews.com/huikan?id=10" allow="fullscreen; encrypted-media; picture-in-picture" allowFullScreen sandbox="allow-scripts allow-same-origin allow-forms allow-popups" referrerPolicy="strict-origin-when-cross-origin"/>}<p className="section-note">内嵌页不加载辅助脚本。无法播放时，请使用上方平台入口。</p></details><p className="section-note">平台提供播放服务，部分内容需登录或订阅。</p></section>;
}
