'use client';
import {useEffect,useState} from 'react';
import { Download, Link2, Smartphone } from 'lucide-react';
import {detectViewingPlatform,nativeAndroidAvailable,ViewingPlatform} from '../lib/viewing';
import release from '../public/user-scripts/release.json';
import appRelease from '../public/downloads/android-build.json';
const version=release.version;
const download=(name:string)=>'/user-scripts/'+name+'?v='+version;
export function ScriptGuide(){
 const [platform,setPlatform]=useState<ViewingPlatform>('ios'),[native,setNative]=useState(false);
 useEffect(()=>{setPlatform(detectViewingPlatform(navigator.userAgent,navigator.platform,navigator.maxTouchPoints));setNative(nativeAndroidAvailable());},[]);
 return <details className="script-guide"><summary>五星体育 · 播放设置 · {version}</summary>
 <p>已按设备选择对应版本，也可手动切换。更新后关闭旧直播标签页，再重新打开五星体育；每台设备只启用对应脚本。</p>
 <div className="segmented platform-tabs">{([['ios','iPhone / iPad'],['android','Android'],['windows','电脑']] as const).map(([id,label])=><button key={id} aria-pressed={platform===id} className={platform===id?'selected':''} onClick={()=>setPlatform(id)}>{label}</button>)}</div>
 {platform==='android'?<>
  <div className="script-platform-note"><Smartphone size={18}/><span>安卓兼容版 {version} · 单文件用户脚本</span></div>
  {native&&<p className="section-note">围场口袋 {appRelease.version} 已内置此版本，使用“App 内观看”即可。旧版 App 请先更新安装包。</p>}
  <ol><li>浏览器观看时，使用支持用户脚本的安卓浏览器及脚本管理器，例如 Firefox + <a href="https://addons.mozilla.org/en-US/firefox/addon/violentmonkey/" target="_blank" rel="noopener noreferrer">Violentmonkey</a>。</li><li>下载并导入安卓 .user.js；也可下载 ZIP 后解压导入。</li><li>启用“收看SMGTV电视节目（安卓兼容版）”{version}，停用旧版和其他平台版本；安卓只需一个脚本。</li><li>在同一浏览器重新打开五星体育，出现“点按播放”时点一下播放器。</li></ol>
  <div className="script-downloads"><a download href={download('smg_fivestar.android.user.js')}><Download size={14}/>安卓脚本 · {version}</a><a download href={download('SMG-Android-'+version+'.zip')}><Download size={14}/>安卓 ZIP</a><a download href={download('android-install.txt')}><Download size={14}/>安卓安装说明</a></div>
 </>:platform==='ios'?<>
  <ol><li>安装 <a href="https://apps.apple.com/app/userscripts/id1463298887" target="_blank" rel="noopener noreferrer">Userscripts</a>，在 App 中选好脚本目录。</li><li>下载下方两个 {version} 文件，替换脚本目录中的同名旧文件，保留 .user.js 后缀。</li><li>Safari 设置 → 扩展中启用 Userscripts，允许访问 kankanews.com；同时启用主脚本和请求助手，停用普通版及旧副本。</li><li>替换后先打开一次 Userscripts 扩展弹窗，让扩展重新读取文件，再刷新直播页；出现“点按播放”时手动点击播放器。</li></ol>
  <div className="script-downloads"><a download href={download('smg_fivestar.ipad.user.js')}><Download size={14}/>iOS 主脚本 · {version}</a><a download href={download('smg_fivestar.ipad-helper.user.js')}><Download size={14}/>iOS 请求助手 · {version}</a><a download href={download('ios-install.md')}><Download size={14}/>iPhone / iPad 说明</a></div>
  <p className="section-note">请在 Safari 直接打开五星体育，两个脚本在直播页面运行。</p>
 </>:<>
  <ol><li>从 <a href="https://www.tampermonkey.net/" target="_blank" rel="noopener noreferrer">Tampermonkey 官网</a>安装对应浏览器扩展。</li><li>下载电脑版 {version}，导入管理器并覆盖旧版，允许访问看看新闻；停用重复副本。</li><li>关闭旧直播标签页，用同一个浏览器重新打开五星体育。</li></ol>
  <div className="script-downloads"><a download href={download('smg_fivestar.user.js')}><Download size={14}/>电脑脚本 · {version}</a></div>
 </>}
 <div className="script-downloads"><a download href={download('SMG-All-Platforms-'+version+'.zip')}><Download size={14}/>三端完整包 · {version}</a></div>
 <a className="text-button" target="_blank" rel="noopener noreferrer" href="https://live.kankanews.com/huikan?id=10">打开五星体育网页 <Link2 size={14}/></a><p className="section-note">浏览器需自行安装并授权脚本管理器。作者、MIT 许可与文件校验见<a href={'/user-scripts/SOURCE.md?v='+version} target="_blank" rel="noopener noreferrer">来源与校验</a>。</p></details>;
}
