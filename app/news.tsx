'use client';
import {useEffect,useState} from 'react';
import { CircleCheck, Link2, Newspaper } from 'lucide-react';
import {editorialNews,editorialUpdatedAt,NewsItem} from '../lib/editorial-news';
import {newsBriefs} from '../lib/news-briefs';
import {Dialog} from './dialog';
import {readPublicJson} from '../lib/public-read';
import {canonicalTeam} from '../lib/race-media';
import type {NewsFeed} from '../lib/news-service';
const newsDate=(n:NewsItem)=>n.datePrecision==='day'?n.date+'':new Date(n.date).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})+' 北京时间';
export function NewsRoom({tla,team,compact=false}:{tla?:string;team?:string;compact?:boolean}){
 const [filter,setFilter]=useState('all'),[article,setArticle]=useState<NewsItem|null>(null);
 const [feed,setFeed]=useState<NewsFeed|null>(null);
 useEffect(()=>{const controller=new AbortController();let live=true;const refresh=async()=>{if(document.hidden)return;try{const next=await readPublicJson<NewsFeed>('/api/news',{signal:controller.signal});if(live&&Array.isArray(next.items)&&next.source!=='unavailable')setFeed(next);}catch{/* Existing briefs remain available while the feed reconnects. */}};void refresh();const timer=setInterval(()=>void refresh(),300000);document.addEventListener('visibilitychange',refresh);return()=>{live=false;controller.abort();clearInterval(timer);document.removeEventListener('visibilitychange',refresh);};},[]);
 const news=[...(feed?.items||[]),...editorialNews].sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
 const related=news.filter(n=>!tla&&!team||!!tla&&n.drivers.includes(tla)||!!team&&n.teams.some(tag=>canonicalTeam({teamShortName:tag})===canonicalTeam({teamShortName:team})));
 const items=related.filter(n=>filter==='all'||n.topic===filter);
 return <section className={'newsroom '+(compact?'compact':'')} aria-label={tla?'车手相关新闻':'围场新闻'}><div className="panel-title"><div><p className="eyebrow">PADDOCK JOURNAL</p><h2>{compact?'相关新闻':'围场新闻'}</h2></div><Newspaper size={22}/></div>{!compact&&<><p className="news-status">{feed?.items.length?`${feed.source==='cache'?'最近保存的快讯':'动态快讯'} · ${new Date(feed.checkedAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})} · 每 5 分钟检查`: `精选简报 · 更新于 ${editorialUpdatedAt.slice(0,10)}`}</p><div className="news-filters" aria-label="新闻分类">{['all',...new Set(news.map(n=>n.topic))].map(t=><button key={t} aria-pressed={filter===t} className={filter===t?'selected':''} onClick={()=>setFilter(t)}>{t==='all'?'全部':t}</button>)}</div></>}
 <div className="news-list">{items.map(n=><article className="card news-card" key={n.id}><div className="news-meta"><span>{n.topic}</span><time dateTime={n.date}>{newsDate(n)}</time></div><button className="news-title-button" onClick={()=>setArticle(n)}><h3>{n.title}</h3></button><p>{n.summary}</p><div className="news-byline"><span>{n.source}{tla&&!n.drivers.includes(tla)?' · 所属车队动态':''}</span><button className="text-button" onClick={()=>setArticle(n)}>阅读简报 <CircleCheck size={14}/></button></div></article>)}</div>
 {!items.length&&<p className="news-empty">暂未整理{compact?'这位车手或所属车队的':'这个分类的'}消息。</p>}

 {article&&<Dialog title={article.title} close={()=>setArticle(null)}><article className="news-article"><div className="news-meta"><span>{article.topic}</span><time>{newsDate(article)}</time></div><p className="article-edition">{article.kind==='feed'?article.source+' · 来源快讯':'围场口袋 · 中文简报'}</p><p className="article-lead">{article.summary}</p>{(newsBriefs[article.id]||[]).map((p,i)=><p key={i}>{p}</p>)}<details className="article-provenance"><summary>发布方与资料出处</summary><p>依据 {article.source} 的公开发布整理；原始发布日期见上方。本站展示简报或订阅摘要。</p><a href={article.url} target="_blank" rel="noopener noreferrer">原始发布记录 <Link2 size={12}/></a></details></article></Dialog>}
 </section>;
}
