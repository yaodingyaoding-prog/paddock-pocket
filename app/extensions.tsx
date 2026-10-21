'use client';
import { CloudSun, Sun, CloudRain, CloudFog, Snowflake, CloudLightning, Wind, Droplets, Flag, RefreshCw, ExternalLink, Watch, Play, Trophy, Download } from 'lucide-react';

type Row = Record<string, any>;
export {WeatherCard} from './weather';
export {ViewingRoom} from './viewing-room';

export function WatchGuide() {
  return <section className="card watch-guide"><div className="panel-title"><div><p className="eyebrow">APPLE WATCH S10</p><h2>真正的手表小组件</h2></div><Watch size={24}/></div><p>目标是独立的 watchOS App，提供智能叠放卡片与表盘复杂功能：下一场倒计时、赛道天气、关注车手积分，以及比赛状态。</p><p className="section-note">当前仍是网页速览，尚未安装系统小组件。手表 WidgetKit、iPhone 桌面小组件及实况活动需要原生扩展、签名安装和真机验证；日历提醒只是已有的辅助功能。</p><div className="android-download"><h3>Android 完整版</h3><p>已编入独立桌面小组件：下一场倒计时、天气和关注车手积分。已完成 Android 模拟器界面及组件验证；APK 适用于 Android。</p><a className="text-button" download href="/downloads/Paddock-Pocket-0.5.0.apk"><Download size={16}/>下载 APK · 0.5.0</a><a className="text-button" target="_blank" rel="noopener noreferrer" href="/downloads/android-build.json">校验与测试范围 <ExternalLink size={13}/></a></div></section>;
}

const classics = [
  {year:2011,name:'加拿大大奖赛',source:'https://www.formula1.com/en/latest/article/canada-2011-torrential-rain-a-safety-car-record-and-buttons-charge-the.1ZWPateMlCFLZ8U6KQBNXj',tag:'雨战 · 逆转',copy:'漫长雨战与最后一圈的胜负变化。'},
  {year:2020,name:'意大利大奖赛',source:'https://www.formula1.com/en/latest/article/gasly-takes-maiden-win-in-monza-thriller-from-sainz-as-penalty-leaves.2wjQyiSgOy8ggwcJlWHhsi',tag:'意外 · 突围',copy:'蒙扎的意外变局，让不同车手站到故事中央。'},
  {year:2021,name:'圣保罗大奖赛',source:'https://www.formula1.com/en/latest/article/race-highlights-watch-all-the-action-from-a-thrilling-sao-paulo-grand-prix.6g3YmSZsCdTHleaIqLVWXP',tag:'冲刺 · 突围',copy:'从周末困局中一路追赶，适合看攻防。'},
  {year:2019,name:'德国大奖赛',source:'https://www.formula1.com/en/latest/article/verstappen-storms-to-sensational-win-in-extraordinary-rain-hit-german-gp.4tqxtGz9gKxhlk9KCf0uZZ',tag:'雨战 · 变局',copy:'天气、轮胎与事故交织，局势反复变化。'},
  {year:2020,name:'萨基尔大奖赛',source:'https://www.formula1.com/en/latest/article/sergio-perez-takes-sensational-maiden-win-in-sakhir-gp-as-tyre-issues-ruin.2TBf7rg5wpgELNALXJLRHV',tag:'布局 · 策略',copy:'高速外圈布局与复杂进站局势，组成独特的比赛。'},
];
export function ClassicRaces() {
  return <section className="classics-section"><div className="panel-title"><div><p className="eyebrow">THE REWATCH LIST</p><h2>值得再看一遍</h2></div><Trophy size={22}/></div><p className="intro-copy">先从这 5 场主观精选开始。编号仅是浏览顺序，不是人气、评分或历史排名。</p><p className="classic-basis">选取依据：雨战变化、策略与进站、逆转追赶等观赛特点，由本站编辑主观挑选。故事背景参考 Formula 1 官方赛报／回顾，未使用用户评分或统计模型。官方链接可能包含剧透。</p><div className="classic-list">{classics.map((r,i)=>{const q=`F1 ${r.year} ${r.name} 回放`;return <article className="card classic-race" key={r.year+r.name}><span className="classic-number">{String(i+1).padStart(2,'0')}</span><div><p className="eyebrow">{r.tag}</p><h3>{r.year} {r.name}</h3><p>{r.copy}</p><a className="classic-source" href={r.source} target="_blank" rel="noopener noreferrer">F1 官方回顾 · 选取参考 <ExternalLink size={12}/></a><div className="classic-links"><a target="_blank" rel="noopener noreferrer" href={'https://search.bilibili.com/all?keyword='+encodeURIComponent(q)}>在 B 站搜索 <ExternalLink size={12}/></a><a target="_blank" rel="noopener noreferrer" href={'https://v.qq.com/x/search/?q='+encodeURIComponent(q)}>在腾讯搜索 <ExternalLink size={12}/></a></div></div></article>})}</div><p className="section-note">当前链接是搜索入口，尚未验证具体视频是否完整或获得授权；不代表已收录可播放的完整回放。</p></section>;
}
