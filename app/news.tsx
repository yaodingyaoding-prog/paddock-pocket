'use client';
import {useState} from 'react';
import {ArrowRight,ExternalLink,Newspaper} from 'lucide-react';
import {editorialNews,editorialUpdatedAt,NewsItem} from '../lib/editorial-news';
import {newsBriefs} from '../lib/news-briefs';
import {Dialog} from './dialog';
const newsDate=(n:NewsItem)=>n.datePrecision==='day'?n.date+'（发布方仅标日期）':new Date(n.date).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})+' 北京时间';
export function NewsRoom({tla,team,compact=false}:{tla?:string;team?:string;compact?:boolean}){
 const [filter,setFilter]=useState('all'),[article,setArticle]=useState<NewsItem|null>(null);
 const related=editorialNews.filter(n=>!tla&&!team||!!tla&&n.drivers.includes(tla)||!!team&&n.teams.includes(team));
 const items=related.filter(n=>filter==='all'||n.topic===filter);
 return <section className={'newsroom '+(compact?'compact':'')} aria-label={tla?'车手相关新闻':'围场新闻'}><div className="panel-title"><div><p className="eyebrow">PADDOCK JOURNAL</p><h2>{compact?'相关新闻':'围场新闻'}</h2></div><Newspaper size={22}/></div>{!compact&&<><p className="intro-copy">把围场故事留在这里读。点开新闻，阅读本站整理的中文简报。</p><p className="news-status">人工精选 · 非实时新闻流 · 整理日期 {editorialUpdatedAt.slice(0,10)}</p><div className="news-filters" aria-label="新闻分类">{['all',...new Set(editorialNews.map(n=>n.topic))].map(t=><button key={t} aria-pressed={filter===t} className={filter===t?'selected':''} onClick={()=>setFilter(t)}>{t==='all'?'全部':t}</button>)}</div></>}
 <div className="news-list">{items.map(n=><article className="card news-card" key={n.id}><div className="news-meta"><span>{n.topic}</span><time dateTime={n.date}>{newsDate(n)}</time></div><button className="news-title-button" onClick={()=>setArticle(n)}><h3>{n.title}</h3></button><p>{n.summary}</p><div className="news-byline"><span>{n.source}{tla&&!n.drivers.includes(tla)?' · 所属车队动态':''}</span><button className="text-button" onClick={()=>setArticle(n)}>站内阅读 <ArrowRight size={14}/></button></div></article>)}</div>
 {!items.length&&<p className="news-empty">暂未整理{compact?'这位车手或所属车队的':'这个分类的'}消息。</p>}
 {!compact&&<p className="section-note">内容为中文整理摘要，保留发布方与日期。尚未接入自动新闻流；未镜像第三方文章全文。</p>}
 {article&&<Dialog title={article.title} close={()=>setArticle(null)}><article className="news-article"><div className="news-meta"><span>{article.topic}</span><time>{newsDate(article)}</time></div><p className="article-edition">围场口袋 · 中文简报</p><p className="article-lead">{article.summary}</p>{(newsBriefs[article.id]||[]).map((p,i)=><p key={i}>{p}</p>)}<details className="article-provenance"><summary>发布方与资料出处</summary><p>依据 {article.source} 的公开公告整理；原始发布日期见上方。本站内容为摘要，非原文全文转载。</p><a href={article.url} target="_blank" rel="noopener noreferrer">原始发布记录 <ExternalLink size={12}/></a></details></article></Dialog>}
 </section>;
}
