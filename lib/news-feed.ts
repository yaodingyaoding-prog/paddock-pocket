import type {NewsItem} from './editorial-news';
export const newsSources=[{id:'fia',name:'FIA',url:'https://www.fia.com/rss/news',hosts:['www.fia.com','fia.com']},{id:'bbc',name:'BBC Sport',url:'https://feeds.bbci.co.uk/sport/formula1/rss.xml',hosts:['www.bbc.co.uk','www.bbc.com','bbc.co.uk','bbc.com']}];
const entities:Record<string,string>={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};
function decode(text:string){return text.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,(_,key:string)=>{if(key[0]!=='#')return entities[key.toLowerCase()]||' ';const code=key[1].toLowerCase()==='x'?parseInt(key.slice(2),16):Number(key.slice(1));return code>0&&code<=0x10ffff?String.fromCodePoint(code):' ';});}
const plain=(text:string)=>decode(text.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')).replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
const driverNames:Record<string,string>={ANT:'Antonelli',RUS:'Russell',HAM:'Hamilton',VER:'Verstappen',LEC:'Leclerc',NOR:'Norris',PIA:'Piastri',HAD:'Hadjar',LAW:'Lawson',GAS:'Gasly',LIN:'Lindblad',COL:'Colapinto',BEA:'Bearman',HUL:'Hulkenberg|Hülkenberg',BOR:'Bortoleto',OCO:'Ocon',ALO:'Alonso',SAI:'Sainz',ALB:'Albon',TSU:'Tsunoda',STR:'Stroll',BOT:'Bottas',PER:'Perez|Pérez'};
const teamNames:Record<string,string>={Mercedes:'Mercedes',Ferrari:'Ferrari',McLaren:'McLaren','Red Bull Racing':'Red Bull','Racing Bulls':'Racing Bulls',Haas:'Haas',Alpine:'Alpine',Williams:'Williams',Audi:'Audi',Cadillac:'Cadillac','Aston Martin':'Aston Martin'};
export function parseNewsFeed(xml:string,source:typeof newsSources[number],now=Date.now()):NewsItem[]{
 const field=(item:string,tag:string)=>(item.match(new RegExp('<'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+tag+'>','i'))?.[1]||'');
 return [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].slice(0,50).flatMap(match=>{
  const title=plain(field(match[1],'title')).slice(0,240),summary=plain(field(match[1],'description')).slice(0,350),published=Date.parse(plain(field(match[1],'pubDate')));
  let url:URL;try{url=new URL(plain(field(match[1],'link')));}catch{return [];}
  if(url.protocol!=='https:'||url.port||url.username||url.password||!source.hosts.includes(url.hostname)||!title||!Number.isFinite(published)||published>now+300000)return [];
  if(source.id==='fia'&&!/\bF1\b|Formula (?:1|One)/i.test(title+' '+summary+' '+plain(field(match[1],'category'))))return [];
  url.hash='';for(const key of [...url.searchParams.keys()])if(key.startsWith('utm_')||key==='at_medium'||key==='at_campaign')url.searchParams.delete(key);
  const text=title+' '+summary,drivers=Object.entries(driverNames).filter(([,name])=>new RegExp('\\b(?:'+name+')\\b','i').test(text)).map(([id])=>id);
  const teams=Object.entries(teamNames).filter(([,name])=>new RegExp('\\b'+name+'\\b','i').test(text)).map(([id])=>id);
  const topic=/livery|liveries|race suit|overalls|helmet/i.test(text)?'涂装与赛车服':/regulation|rule change|technical directive/i.test(text)?'规则动态':/upgrade|aerodynamic|floor|front wing/i.test(text)?'技术动态':drivers.length?'车手动态':'车队动态';
  return [{id:'feed:'+url.href,title,summary,date:new Date(published).toISOString(),datePrecision:'second' as const,source:source.name,url:url.href,drivers,teams,topic,kind:'feed' as const}];
 });
}
