export type WeatherSession={id:string;type?:string;sessionName?:string;startDate:string;endDate?:string};
export const weatherSessionName=(s:WeatherSession)=>({FirstPractice:'一练',SecondPractice:'二练',ThirdPractice:'三练',StandardQualifying:'排位赛',SprintQualifying:'冲刺排位',SprintRace:'冲刺赛',MainRace:'正赛'}[s.type||'']||s.sessionName||'场次');
export function weatherRefreshMs(sessions:WeatherSession[],now:number){
 const times=sessions.map(s=>({start:Date.parse(s.startDate),end:Date.parse(s.endDate||'')||Date.parse(s.startDate)+2*3600000})).filter(s=>Number.isFinite(s.start));
 if(times.some(s=>now>=s.start-30*60000&&now<=s.end+30*60000))return 5*60000;
 if(times.some(s=>s.start>now&&s.start-now<=48*3600000))return 3600000;
 return 3*3600000;
}
export function weatherHourIndex(times:number[],epochSeconds:number){
 if(!Number.isFinite(epochSeconds)||!Array.isArray(times))return -1;
 return times.findIndex(t=>Number.isFinite(t)&&t<=epochSeconds&&epochSeconds<t+3600);
}
export function weatherForecastStatus(session:WeatherSession|undefined,times:number[],now:number){
 if(!session)return 'missing';
 const start=Date.parse(session.startDate),end=Date.parse(session.endDate||'')||start+2*3600000;
 if(!Number.isFinite(start))return 'missing';
 if(end<now)return 'finished';
 return weatherHourIndex(times,start/1000)>=0?'available':'outside-range';
}
export function weatherUrl(key:string){
 const values=key.split(',').map(Number);if(values.length!==2||!values.every(Number.isFinite)||Math.abs(values[0])>90||Math.abs(values[1])>180)throw Error('赛道坐标无效');
 const query=new URLSearchParams({latitude:String(values[0]),longitude:String(values[1]),current:'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,precipitation',hourly:'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,precipitation_probability,weather_code',forecast_days:'16',timezone:'auto',timeformat:'unixtime'});
 return 'https://api.open-meteo.com/v1/forecast?'+query;
}
