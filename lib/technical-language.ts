type Row = Record<string, any>;
const terms: [string,string][] = [
 ['地板板','底板导流板'],['侧舱入口/焦炭','侧箱进气口／可乐瓶区域'],['镜子停留','后视镜支架'],
 ['前角勺','前轮区域进气口'],['家具','导流构件'],['gaitor','防尘套'],
 ['空间的流畅性','气流组织'],['局部承载能力','局部气动载荷'],['流量调节','气流调节'],['地板','底板'],
];
export function technicalText(value: unknown) {
 if (typeof value !== 'string') return value;
 return terms.reduce((text,[from,to])=>text.split(from).join(to),value);
}
export function normalizeTechnicalLanguage(data: Row) {
 if (!Array.isArray(data.technical?.updates)) return data;
 return {...data,technical:{...data.technical,updates:data.technical.updates.map((row:Row)=>{
  const next={...row};for(const key of ['component','description','difference','reason'])if(key in next)next[key]=technicalText(next[key]);return next;
 })}};
}
