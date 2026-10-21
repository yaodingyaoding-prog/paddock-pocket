'use client';
import {useEffect,useState} from 'react';
import {Play,ExternalLink,Smartphone,Monitor,Info} from 'lucide-react';
import {ScriptGuide} from './script-guide';
import {detectViewingPlatform,nativeAndroidAvailable,tencentAppLink} from '../lib/viewing';
export function ViewingRoom(){
 const [embed,setEmbed]=useState(false),[native,setNative]=useState(false),[mobile,setMobile]=useState(false),[appHint,setAppHint]=useState(false);
 useEffect(()=>{setNative(nativeAndroidAvailable());setMobile(detectViewingPlatform(navigator.userAgent,navigator.platform,navigator.maxTouchPoints)!=='windows');},[]);
 function openTencent(){if(native){window.dispatchEvent(new Event('paddock:open-tencent'));return;}setAppHint(true);window.location.href=tencentAppLink;}
 return <section className="card viewing-room"><div className="panel-title"><div><p className="eyebrow">RACE ON SCREEN</p><h2>观赛中心</h2></div><Play size={23}/></div><p className="intro-copy">选一个入口，进入你的比赛周末。平台的转播、登录和会员状态以播放页为准。</p>
 <div className="viewing-channel-grid"><article className="viewing-channel tone-orange"><span className="section-icon"><Play size={22}/></span><h3>五星体育</h3><p>看看新闻直播与回看，附设备对应的 SMG 脚本。</p>{native?<button className="channel-action" onClick={()=>window.dispatchEvent(new Event('paddock:open-smg'))}>App 内打开 · 加载脚本 <Play size={16}/></button>:<a className="channel-action" href="https://live.kankanews.com/huikan?id=10" target="_blank" rel="noopener noreferrer">打开五星体育网页 <ExternalLink size={16}/></a>}</article>
 <article className="viewing-channel tone-blue"><span className="section-icon"><Monitor size={22}/></span><h3>腾讯视频 · 网页版</h3><p>适合电脑或手机浏览器，在官方网页选择 F1 内容。</p><a className="channel-action" href="https://v.qq.com/" target="_blank" rel="noopener noreferrer">进入网页版 <ExternalLink size={16}/></a></article>
 <article className="viewing-channel tone-purple"><span className="section-icon"><Smartphone size={22}/></span><h3>腾讯视频 · App</h3><p>{native?'直接唤起已安装的腾讯视频。':mobile?'尝试唤起已安装的腾讯视频，适合 iPhone / iPad 和 Android。':'手机和平板可尝试唤起腾讯视频；电脑请使用网页版。'}</p><button className="channel-action" onClick={openTencent}>打开腾讯视频 App <Smartphone size={16}/></button></article></div>
 {appHint&&<p className="viewing-note" role="status">已请求系统打开腾讯视频。未安装、浏览器拦截或未唤起时，请用网页版；iPhone／iPad 的唤起效果尚未真机验证。</p>}
 <div className="viewing-note"><Info size={17}/><p>{native?'增强观赛在独立窗口打开官方页面，仅在看看新闻的 /huikan 页面加载随包脚本；不向它开放本站的下载、文件或账号接口。跨域请求、页面加载时机及实际视频仍可能受平台限制，可使用下方浏览器方案。':'普通网页无法直接给跨域的看看新闻内嵌页注入脚本。安装匹配设备的脚本管理器并启用一次后，直接打开官方页面即可自动匹配运行。'}</p></div>
 <ScriptGuide/><details className="plain-embed"><summary>仅内嵌官方页面（不加载脚本）</summary><button className="small-button" onClick={()=>setEmbed(!embed)}>{embed?'关闭内嵌页':'载入看看新闻官方页'}</button>{embed&&<iframe className="live-frame" title="看看新闻官方页面" src="https://live.kankanews.com/huikan?id=10" allow="fullscreen; encrypted-media; picture-in-picture" allowFullScreen sandbox="allow-scripts allow-same-origin allow-forms allow-popups" referrerPolicy="strict-origin-when-cross-origin"/>}<p className="section-note">如官方页面不允许内嵌或无法播放，请使用上方入口。</p></details></section>;
}
