export type ReplaySession = 'race'|'qualifying'|'sprint'|'practice';
export const replaySessions: {id:ReplaySession;label:string;query:string;types:string[]}[] = [
  {id:'race',label:'正赛',query:'正赛',types:['MainRace']},
  {id:'qualifying',label:'排位赛',query:'排位赛',types:['StandardQualifying']},
  {id:'sprint',label:'冲刺赛',query:'冲刺赛',types:['SprintRace']},
  {id:'practice',label:'练习赛',query:'自由练习赛',types:['FirstPractice','SecondPractice','ThirdPractice']},
];
export function replayLinks(year:number,raceName:string,session:ReplaySession='race') {
  const kind=replaySessions.find(item=>item.id===session)||replaySessions[0];
  const query=`F1 ${year} ${raceName} ${kind.query} 全场回放`;
  return {query,bilibili:'https://search.bilibili.com/all?keyword='+encodeURIComponent(query),
    tencent:'https://v.qq.com/x/search/?q='+encodeURIComponent(query)};
}
export function replayRaceMatches(race:Record<string,any>,search:string,session:ReplaySession) {
  const types=replaySessions.find(item=>item.id===session)?.types||['MainRace'];
  const schedules=race.schedule||[];
  if(schedules.length&&!schedules.some((item:Record<string,any>)=>types.includes(item.type)))return false;
  const text=[race.name,race.nameKey,race.circuit?.name,race.circuit?.place,String(race.round)].filter(Boolean).join(' ').toLocaleLowerCase();
  return !search.trim()||text.includes(search.trim().toLocaleLowerCase());
}
