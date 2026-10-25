type Row=Record<string,any>;
import {normalizeTechnicalLanguage} from './technical-language';
const origin='https://api.f1push.com';
const uuid=/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i;
const manifests=new Map<string,{expires:number;data:Row}>();
const parts=new Map<string,{expires:number;data:Row}>();
export class ToolDataError extends Error{constructor(message:string,public status=503){super(message);}}
async function json(url:string,headers:Record<string,string>={}){
 const response=await fetch(url,{headers:{Accept:'application/json',...headers},signal:AbortSignal.timeout(20000),redirect:'manual'});
 if(!response.ok)throw new ToolDataError(response.status===404?'该场次尚未发布遥测数据，请选择其他已完赛场次。':response.status===403?'数据源暂时拒绝访问，请稍后重试。':'数据暂时无法读取，请稍后重试。',response.status===404?404:503);
 let bytes=new Uint8Array(await response.arrayBuffer());if(bytes.byteLength>12*1024*1024)throw new ToolDataError('数据包过大，请缩小查询范围。');
 if(bytes[0]===31&&bytes[1]===139){const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));bytes=new Uint8Array(await new Response(stream).arrayBuffer());}
 if(bytes.byteLength>16*1024*1024)throw new ToolDataError('数据包过大。');return JSON.parse(new TextDecoder().decode(bytes));
}
async function manifest(session:string){
 const cached=manifests.get(session);if(cached&&cached.expires>Date.now())return cached.data;
 const raw=await json(origin+'/api/v1/sessions/'+session+'/replay/package/manifest?storage=oss');const data=raw.data;
 if(!data||data.sessionId!==session||data.schemaVersion!==1||!Array.isArray(data.assets))throw new ToolDataError('遥测清单格式暂不支持。');
 if(manifests.size>15)manifests.clear();manifests.set(session,{expires:Date.now()+120000,data});return data as Row;
}
export async function toolData(query:URLSearchParams){
 const kind=query.get('kind');
 if(kind==='technical'){
  const year=query.get('year')||'2026',gp=query.get('gp')||'';
  if(!/^20\d{2}$/.test(year)||(gp&&!uuid.test(gp)))throw new ToolDataError('无效的技术资料参数。',400);
  const raw=await json(origin+'/api/v1/fia/dashboard?'+new URLSearchParams({lang:'zh',year,...(gp?{grandPrixId:gp}:{})}));if(!raw.data)throw new ToolDataError('技术报告尚未发布。');return normalizeTechnicalLanguage(raw.data);
 }
 const session=query.get('session')||'';if(!uuid.test(session))throw new ToolDataError('无效的场次编号。',400);
 if(!['manifest','part'].includes(kind||''))throw new ToolDataError('无效的数据类型。',400);
 const data=await manifest(session);
 if(kind==='manifest')return {sessionId:data.sessionId,version:data.version,datasetVersion:data.datasetVersion,chunkMinutes:data.chunkMinutes,createdAt:data.createdAt,sourceType:data.sourceType,paths:data.assets.map((a:Row)=>a.path)};
 const path=query.get('path')||'';
 if(!/^(?:metadata|timeline)\.json\.gz$/.test(path)&&!/^drivers\/[a-f0-9-]{36}\/\d{5}\.json\.gz$/i.test(path))throw new ToolDataError('无效的数据分片。',400);
 const cacheKey=session+'/'+data.version+'/'+path,cached=parts.get(cacheKey);if(cached&&cached.expires>Date.now())return cached.data;
 const asset=data.assets.find((a:Row)=>a.path===path);if(!asset)throw new ToolDataError('所选车手在该时间段没有遥测记录。',404);
 const url=new URL(asset.assetUrl,origin);const prefix='/replay-package-assets/oss/'+session+'/'+data.version+'/';
 if(url.origin!==origin||url.pathname!==prefix+path||url.search||url.hash)throw new ToolDataError('数据资产路径不匹配。');
 const value=await json(url.href,{'X-F1-Replay-Token':String(asset.assetToken),'X-F1-Replay-Expires':String(asset.assetTokenExpiresAt)});
 if(value.sessionId&&value.sessionId!==session||value.session?.id&&value.session.id!==session||value.datasetVersion&&value.datasetVersion!==data.datasetVersion)throw new ToolDataError('分片版本不一致，请重新载入比赛。');
 const driver=path.match(/^drivers\/([^/]+)\//)?.[1];if(driver&&value.driverId!==driver)throw new ToolDataError('车手数据不匹配。');
 if(parts.size>=20)parts.clear();parts.set(cacheKey,{expires:Date.now()+600000,data:value});return value;
}
export async function handleToolRequest(request:Request){
 try{return Response.json({data:await toolData(new URL(request.url).searchParams),updatedAt:new Date().toISOString()},{headers:{'Cache-Control':'private, no-store'}});}
 catch(error){if(!(error instanceof ToolDataError))console.warn('tools-data:',error instanceof Error?error.name+': '+error.message:'invalid response');return Response.json({error:error instanceof ToolDataError?error.message:'数据暂时无法读取，请稍后重试。'},{status:error instanceof ToolDataError?error.status:503});}
}
