'use client';
import androidRelease from '../public/downloads/android-build.json';
import { CloudSun, Sun, CloudRain, CloudFog, Snowflake, CloudLightning, Wind, Droplets, Flag, RefreshCw, Link2, Watch, Play, Trophy, Download } from 'lucide-react';

type Row = Record<string, any>;
export {WeatherCard} from './weather';
export {ViewingRoom} from './viewing-room';

export function WatchGuide() {
 return <section className="card watch-guide">
  <div className="panel-title"><div><p className="eyebrow">APPS & WIDGETS</p><h2>设备支持</h2></div><Watch size={24}/></div>
  <div className="android-download"><h3>Android</h3><p>赛程、积分与天气桌面组件</p><a className="text-button" href="/download"><Download size={16}/>下载 Android 正式版 · {androidRelease.version}</a></div>
  <div className="native-device-actions">
   <button className="text-button native-widget-pin" onClick={()=>{window.location.href='paddock://pin-widget';}}><Watch size={17}/>添加桌面小组件</button>
   <button className="text-button native-widget-pin" onClick={()=>{window.location.href='paddock://check-updates';}}><RefreshCw size={17}/>检查安装包更新</button>
  </div>
  <details className="source-details"><summary>安装与兼容性</summary><p>Android 8.0 及以上；在线版通过 APK 安装，页面随网站更新。系统功能升级需要安装新包。iPhone 与 iPad 可从 Safari 添加到主屏幕。Apple Watch 原生组件暂未提供。</p><a className="text-button" target="_blank" rel="noopener noreferrer" href="/downloads/android-build.json">版本与文件校验 <Link2 size={13}/></a></details>
 </section>;
}

const classics = [
  {year:2011,name:'加拿大大奖赛',source:'https://www.formula1.com/en/latest/article/canada-2011-torrential-rain-a-safety-car-record-and-buttons-charge-the.1ZWPateMlCFLZ8U6KQBNXj',tag:'雨战 · 逆转',copy:'漫长雨战与最后一圈的胜负变化。'},
  {year:2020,name:'意大利大奖赛',source:'https://www.formula1.com/en/latest/article/gasly-takes-maiden-win-in-monza-thriller-from-sainz-as-penalty-leaves.2wjQyiSgOy8ggwcJlWHhsi',tag:'意外 · 突围',copy:'蒙扎的意外变局，让不同车手站到故事中央。'},
  {year:2021,name:'圣保罗大奖赛',source:'https://www.formula1.com/en/latest/article/race-highlights-watch-all-the-action-from-a-thrilling-sao-paulo-grand-prix.6g3YmSZsCdTHleaIqLVWXP',tag:'冲刺 · 突围',copy:'从周末困局中一路追赶，适合看攻防。'},
  {year:2019,name:'德国大奖赛',source:'https://www.formula1.com/en/latest/article/verstappen-storms-to-sensational-win-in-extraordinary-rain-hit-german-gp.4tqxtGz9gKxhlk9KCf0uZZ',tag:'雨战 · 变局',copy:'天气、轮胎与事故交织，局势反复变化。'},
  {year:2020,name:'萨基尔大奖赛',source:'https://www.formula1.com/en/latest/article/sergio-perez-takes-sensational-maiden-win-in-sakhir-gp-as-tyre-issues-ruin.2TBf7rg5wpgELNALXJLRHV',tag:'布局 · 策略',copy:'高速外圈布局与复杂进站局势，组成独特的比赛。'},
];
export function ClassicRaces() {
  return <section className="classics-section"><div className="panel-title"><div><p className="eyebrow">THE REWATCH LIST</p><h2>值得再看一遍</h2></div><Trophy size={22}/></div><p className="intro-copy">编辑精选 · 雨战、逆转与经典攻防</p><div className="classic-list">{classics.map((r,i)=>{const q=`F1 ${r.year} ${r.name} 回放`;return <article className="card classic-race" key={r.year+r.name}><span className="classic-number">{String(i+1).padStart(2,'0')}</span><div><p className="eyebrow">{r.tag}</p><h3>{r.year} {r.name}</h3><p>{r.copy}</p><a className="classic-source" href={r.source} target="_blank" rel="noopener noreferrer">比赛回顾 <Link2 size={12}/></a><div className="classic-links"><a target="_blank" rel="noopener noreferrer" href={'https://search.bilibili.com/all?keyword='+encodeURIComponent(q)}>在 B 站搜索 <Link2 size={12}/></a><a target="_blank" rel="noopener noreferrer" href={'https://v.qq.com/x/search/?q='+encodeURIComponent(q)}>在腾讯搜索 <Link2 size={12}/></a></div></div></article>})}</div><p className="section-note">回放入口按比赛名称检索。</p></section>;
}
