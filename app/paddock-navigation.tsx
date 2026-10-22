'use client';
import {useEffect,useRef,useState} from 'react';
import { Activity, CircleEllipsis, BookOpen, Clapperboard, Flag, Map, Newspaper, Play, Settings2, Trophy } from 'lucide-react';
import { transitionPage } from './page-motion';
import { driverRouteHash, parseDriverRoute, type DriverReturnTab } from '../lib/driver-route';

export type NavTab='schedule'|'rankings'|'widgets'|'discover'|'profile';
export const detailPages={
 viewing:{title:'观赛中心',en:'WATCH LIVE',parent:'discover',tone:'orange',Icon:Play,copy:'五星体育、腾讯视频与设备播放设置。',tag:'直播与播放设置'},
 replays:{title:'赛事回放',en:'RACE REPLAYS',parent:'discover',tone:'orange',Icon:Clapperboard,copy:'按赛季、分站与场次查找比赛回放。',tag:'B 站 · 腾讯视频'},
 news:{title:'围场新闻',en:'PADDOCK JOURNAL',parent:'discover',tone:'rose',Icon:Newspaper,copy:'车队新涂装、赛车升级与车手动态。',tag:'有来源的围场故事'},
 telemetry:{title:'遥测分析',en:'READ THE RACE',parent:'discover',tone:'blue',Icon:Activity,copy:'双车数据对比，读懂每一脚油门。',tag:'速度 · 圈速 · 策略'},
 technical:{title:'技术分析',en:'UNDER THE BODYWORK',parent:'discover',tone:'purple',Icon:Settings2,copy:'逐站升级、赛季矩阵与动力单元用量。',tag:'赛车为什么更快'},
 classics:{title:'经典比赛',en:'THE REWATCH LIST',parent:'discover',tone:'gold',Icon:Trophy,copy:'雨战、逆转与经典攻防。',tag:'编辑精选'},
 encyclopedia:{title:'F1 百科',en:'KNOW THE SPORT',parent:'discover',tone:'mint',Icon:BookOpen,copy:'旗号、术语、积分与比赛周末指南。',tag:'从入门到看懂'},
 rules:{title:'2026 新规',en:'THE NEXT CHAPTER',parent:'discover',tone:'blue',Icon:Flag,copy:'主动空气动力、电能管理与新一代赛车。',tag:'规则改变比赛'},
 circuit:{title:'赛道档案',en:'CIRCUIT ARCHIVE',parent:'schedule',tone:'mint',Icon:Map,copy:'布局、圈速纪录与历届赛道数据。',tag:'每一站，都有故事'},
 championship:{title:'夺冠条件',en:'THE TITLE EQUATION',parent:'rankings',tone:'purple',Icon:Trophy,copy:'选择车手与名次，查看精确夺冠条件。',tag:'算清争冠的每一分'},
} as const;
export type DetailPage=keyof typeof detailPages;
const tabs:NavTab[]=['schedule','rankings','widgets','discover','profile'];
function readRoute(){
 const driver = parseDriverRoute(window.location.hash);
 if (driver) return {tab:'rankings' as NavTab,detail:'' as const,...driver};
 const [name,id]=window.location.hash.slice(1).split('/');
 const tab=tabs.includes(name as NavTab)?name as NavTab:'schedule';
 const detail=id&&Object.hasOwn(detailPages,id)&&detailPages[id as DetailPage].parent===tab?id as DetailPage:'' as const;
 return {tab,detail,driverId:'',driverSeason:'',driverFrom:'rankings' as DriverReturnTab};
}
export function usePaddockNavigation(){
 const [route,setRoute]=useState<{tab:NavTab;detail:DetailPage|'';driverId:string;driverSeason:string;driverFrom:DriverReturnTab}>({tab:'schedule',detail:'',driverId:'',driverSeason:'',driverFrom:'rankings'});
 const currentHash=useRef(''),pendingHash=useRef('');
 useEffect(()=>{currentHash.current=window.location.hash;setRoute(readRoute());const sync=()=>{if(currentHash.current===window.location.hash)return;currentHash.current=window.location.hash;pendingHash.current='';transitionPage(()=>{setRoute(readRoute());window.scrollTo({top:0});},'back');};window.addEventListener('hashchange',sync);window.addEventListener('popstate',sync);return()=>{window.removeEventListener('hashchange',sync);window.removeEventListener('popstate',sync);};},[]);
 function navigate(tab:NavTab,detail:DetailPage|''=''){
  const hash='#'+tab+(detail?'/'+detail:'');
  if(pendingHash.current===hash)return;
  if(window.location.hash===hash&&!pendingHash.current){window.scrollTo({top:0});return;}
  pendingHash.current=hash;
  const direction=(route.detail&&!detail&&route.tab===tab)||tabs.indexOf(tab)<tabs.indexOf(route.tab)?'back':'forward';
  transitionPage(()=>{if(window.location.hash!==hash)window.history.pushState(null,'',hash);currentHash.current=hash;pendingHash.current='';setRoute({tab,detail,driverId:'',driverSeason:'',driverFrom:'rankings'});window.scrollTo({top:0});},direction);
 }
 function openDriver(id:string,season:string,from:NavTab){
  const hash=driverRouteHash(id,season,from);
  if(pendingHash.current===hash||window.location.hash===hash&&!pendingHash.current)return;
  pendingHash.current=hash;
  transitionPage(()=>{if(window.location.hash!==hash)window.history.pushState({paddockDriverEntry:true},'',hash);currentHash.current=hash;pendingHash.current='';setRoute(readRoute());window.scrollTo({top:0});});
 }
 function closeDriver(){
  if(window.history.state?.paddockDriverEntry)window.history.back();
  else transitionPage(()=>{window.history.replaceState(null,'','#'+route.driverFrom);currentHash.current=window.location.hash;pendingHash.current='';setRoute(readRoute());window.scrollTo({top:0});},'back');
 }
 return {...route,setTab:(tab:NavTab)=>navigate(tab),openDetail:(id:DetailPage)=>navigate(detailPages[id].parent,id),openDriver,closeDriver};
}
export function SectionLink({id,onOpen,compact=false}:{id:DetailPage;onOpen:(id:DetailPage)=>void;compact?:boolean}){
 const p=detailPages[id],Icon=p.Icon;
 return <button className={'section-link tone-'+p.tone+(compact?' compact-link':'')} onClick={()=>onOpen(id)}><span className="section-icon"><Icon size={21}/></span><span className="section-link-copy"><strong>{p.title}</strong><small>{compact?p.tag:p.copy}</small></span><CircleEllipsis size={17}/></button>;
}
export function DiscoverOverview({onOpen}:{onOpen:(id:DetailPage)=>void}){
 const entries:DetailPage[]=['replays','telemetry','technical','classics','encyclopedia','rules'];
 return <div className="discovery-overview"><div className="discovery-feature-grid"><button className="discovery-feature tone-orange" onClick={()=>onOpen('viewing')}><span className="feature-kicker"><Play size={16}/> RACE DAY ESSENTIALS</span><h2>观赛中心</h2><p>直播平台与播放设置</p><span className="feature-action">进入观赛中心 <CircleEllipsis size={18}/></span><Play className="feature-watermark" aria-hidden="true" fill="currentColor" strokeWidth={0}/></button><button className="discovery-feature journal-feature tone-rose" onClick={()=>onOpen('news')}><span className="feature-kicker"><Newspaper size={16}/> PADDOCK JOURNAL</span><h2>围场新闻</h2><p>车手、赛车与车队动态</p><span className="feature-action">浏览围场新闻 <CircleEllipsis size={18}/></span><Flag className="feature-watermark" aria-hidden="true"/></button></div><div className="hub-section-heading"><div><p className="eyebrow">EXPLORE THE DETAILS</p><h2>赛事工具</h2></div><span>数据 · 技术 · 历史</span></div><div className="explore-card-grid">{entries.map((id,i)=>{const p=detailPages[id],Icon=p.Icon;return <button key={id} className={'explore-card tone-'+p.tone} onClick={()=>onOpen(id)}><div className="explore-card-top"><span className="section-icon"><Icon size={24}/></span><span className="explore-number">0{i+1}</span></div><p className="eyebrow">{p.en}</p><h3>{p.title}</h3><p>{p.copy}</p><span className="explore-card-bottom">{p.tag}<CircleEllipsis size={17}/></span></button>;})}</div></div>;
}
export const appearanceThemes=[['dark','月夜黑','#12151e'],['light','云雾白','#eef1f6'],['navy','深海蓝','#162a45'],['forest','松林绿','#193b32'],['plum','暮光紫','#35233f'],['carbon','碳纤灰','#24272c'],['burgundy','赛道酒红','#4c2533'],['ocean','深湾青','#143c48'],['sand','暖砂白','#ede3d3'],['ice','冰川蓝','#e4eff5']];
export const accentColors=[['mint','薄荷绿','#52e1bd'],['red','跃动红','#ff7c85'],['orange','木瓜橙','#ffb167'],['blue','竞速蓝','#8fbbff'],['purple','暮光紫','#c2a5ff'],['gold','香槟金','#ead082'],['cyan','电光青','#65d9ed'],['lime','极速黄绿','#c9e979'],['pink','樱花粉','#efa4d3'],['silver','钛银','#b6c6d5'],['coral','珊瑚橘','#ff9c82'],['violet','电光紫','#a99bff']];
