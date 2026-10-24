'use client';
import {useEffect,useState} from 'react';
import {Download,Play} from 'lucide-react';
import {detectViewingPlatform,nativeAndroidAvailable,ViewingPlatform} from '../lib/viewing';
import release from '../public/user-scripts/release.json';
import appRelease from '../public/downloads/android-build.json';
const version=release.version;
const file=(name:string)=>'/user-scripts/'+name+'?v='+version;
export function ScriptGuide(){
 const [platform,setPlatform]=useState<ViewingPlatform>('ios'),[native,setNative]=useState(false);
 useEffect(()=>{setPlatform(detectViewingPlatform(navigator.userAgent,navigator.platform,navigator.maxTouchPoints));setNative(nativeAndroidAvailable());},[]);
 return <section className="script-guide"><h3>第一次看？跟着做就好</h3>
 <div className="segmented platform-tabs">{([['ios','iPhone / iPad'],['android','安卓手机'],['windows','电脑']] as const).map(([id,label])=><button key={id} aria-pressed={platform===id} className={platform===id?'selected':''} onClick={()=>setPlatform(id)}>{label}</button>)}</div>
 {platform==='android'?(native?<><p>播放设置已内置，直接开始观看。</p><button className="text-button" onClick={()=>window.dispatchEvent(new Event('paddock:open-smg'))}><Play size={16}/>开始观看五星体育</button></>:<><ol><li>下载并安装围场口袋。</li><li>打开 App → 发现 → 观赛中心 → 五星体育。</li><li>点击“App 内观看”，再点播放。</li></ol><a className="text-button" href="/download"><Download size={16}/>下载安卓 App · {appRelease.version}</a><p className="section-note">不需要另外安装脚本。</p></>):platform==='ios'?<><ol><li>安装 <a href="https://apps.apple.com/app/userscripts/id1463298887" target="_blank" rel="noopener noreferrer">Userscripts</a>，在 App 中选择一个保存文件的文件夹。</li><li>把下方两个文件下载到这个文件夹。</li><li>设置 → Safari → 扩展 → Userscripts，打开扩展并允许访问看看新闻。然后用 Safari 打开直播。</li></ol><div className="script-downloads"><a download href={file('smg_fivestar.ipad.user.js')}><Download size={14}/>下载文件 1</a><a download href={file('smg_fivestar.ipad-helper.user.js')}><Download size={14}/>下载文件 2</a></div><details><summary>第一次设置的详细步骤</summary><p>在 Userscripts App 内点 Set Userscripts Directory，选中上述文件夹。Safari 打开直播后，点地址栏的扩展按钮 → Userscripts，启用两个文件。以后直接打开直播即可；出现“点按播放”时点一下画面。</p><a href={file('ios-install.md')} target="_blank" rel="noopener noreferrer">完整操作说明</a></details></>:<><ol><li>安装 <a href="https://www.tampermonkey.net/" target="_blank" rel="noopener noreferrer">Tampermonkey 浏览器扩展</a>。</li><li>点击“安装播放助手”，在弹出页点击“安装”。</li><li>用同一浏览器打开直播，点击播放。</li></ol><a className="text-button" href={file('smg_fivestar.user.js')} target="_blank" rel="noopener noreferrer">安装播放助手</a></>}
 {!native&&<a className="text-button" target="_blank" rel="noopener noreferrer" href="https://live.kankanews.com/huikan?id=10"><Play size={16}/>打开五星体育</a>}
 <details className="source-details"><summary>更新与其他安装方式</summary><p>播放助手 {version}。更新时替换同名旧文件，只保留当前设备对应的版本，然后重新打开直播。</p><div className="script-downloads"><a download href={file('SMG-All-Platforms-'+version+'.zip')}>下载完整包</a><a download href={file('smg_fivestar.android.user.js')}>安卓浏览器脚本</a><a href={file('android-install.txt')} target="_blank" rel="noopener noreferrer">安卓浏览器设置</a><a href={file('SOURCE.md')} target="_blank" rel="noopener noreferrer">作者与许可</a></div></details></section>;
}
