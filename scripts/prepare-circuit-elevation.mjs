import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const layoutSource='https://github.com/bacinger/f1-circuits/blob/8094e957b8d6aa8b9f4510c93968556cccd30e02/f1-circuits.geojson';
const models=JSON.parse(fs.readFileSync('lib/circuit-models.json','utf8'));
const layouts=JSON.parse(fs.readFileSync(process.argv[2] || '.local-artifacts/f1-circuits.geojson','utf8'));
const output='public/circuits/elevation';
fs.mkdirSync(output,{recursive:true});
fs.mkdirSync('.local-artifacts/elevation-responses',{recursive:true});
const manifest={};
const sampleCount=160;

async function requestElevation(url){
 const executable=process.platform==='win32'?'curl.exe':'curl';
 const platformOptions=process.platform==='win32'?['--ssl-revoke-best-effort']:[];
 for(let attempt=0;attempt<3;attempt++){
  const result=spawnSync(executable,[...platformOptions,'-sS','--connect-timeout','15','--max-time','40','-w','\n%{http_code}',url],{encoding:'utf8',maxBuffer:1048576});
  if(result.status===0){
   const separator=result.stdout.lastIndexOf('\n');
   return {status:Number(result.stdout.slice(separator+1)),body:result.stdout.slice(0,separator)};
  }
  if(attempt===2)throw Error('Elevation connection failed: '+result.stderr);
  await new Promise(resolve=>setTimeout(resolve,2000));
 }
}

function sampleLayout(coordinates){
 const origin=coordinates[0];
 const longitudeScale=111195.08*Math.cos(origin[1]*Math.PI/180);
 const vertices=coordinates.map(([longitude,latitude])=>[(longitude-origin[0])*longitudeScale,(latitude-origin[1])*111195.08]);
 if(Math.hypot(vertices.at(-1)[0],vertices.at(-1)[1])>0.01)vertices.push([0,0]);
 const cumulative=[0];
 for(let i=1;i<vertices.length;i++)cumulative.push(cumulative.at(-1)+Math.hypot(vertices[i][0]-vertices[i-1][0],vertices[i][1]-vertices[i-1][1]));
 const length=cumulative.at(-1);
 const samples=[];
 let segment=1;
 for(let i=0;i<sampleCount;i++){
  const distance=i*length/sampleCount;
  while(cumulative[segment]<distance)segment++;
  const fraction=(distance-cumulative[segment-1])/(cumulative[segment]-cumulative[segment-1]);
  const east=vertices[segment-1][0]+fraction*(vertices[segment][0]-vertices[segment-1][0]);
  const north=vertices[segment-1][1]+fraction*(vertices[segment][1]-vertices[segment-1][1]);
  samples.push({east,north,latitude:origin[1]+north/111195.08,longitude:origin[0]+east/longitudeScale});
 }
 return {samples,length};
}

for(const [id,model] of Object.entries(models)){
 const feature=layouts.features.find(item=>item.properties.id===model.sourceId);
 if(!feature || feature.geometry.type!=='LineString')throw Error('Missing layout '+model.sourceId);
 const {samples,length}=sampleLayout(feature.geometry.coordinates);
 const elevations=[];
 for(let offset=0;offset<samples.length;offset+=100){
  const batch=samples.slice(offset,offset+100);
  const coordinateHash=createHash('sha256').update(JSON.stringify(batch.map(p=>[p.latitude.toFixed(6),p.longitude.toFixed(6)]))).digest('hex').slice(0,16);
  const cacheFile=path.join('.local-artifacts/elevation-responses',id+'-'+offset+'-'+coordinateHash+'.json');
  let payload;
  if(fs.existsSync(cacheFile))payload=JSON.parse(fs.readFileSync(cacheFile,'utf8'));
  else{
   const query=new URLSearchParams({latitude:batch.map(p=>p.latitude.toFixed(6)).join(','),longitude:batch.map(p=>p.longitude.toFixed(6)).join(',')});
   // The public service counts each coordinate toward its request allowance.
   await new Promise(resolve=>setTimeout(resolve,batch.length*120));
   const url='https://api.open-meteo.com/v1/elevation?'+query;
   let response=await requestElevation(url);
   if(response.status===429){
    await new Promise(resolve=>setTimeout(resolve,61000));
    response=await requestElevation(url);
   }
   if(response.status!==200)throw Error('Elevation service HTTP '+response.status+' for '+id);
   payload=JSON.parse(response.body);
   if(!Array.isArray(payload.elevation)||payload.elevation.length!==batch.length||!payload.elevation.every(Number.isFinite))throw Error('Invalid elevation response for '+id);
   fs.writeFileSync(cacheFile,JSON.stringify(payload));
  }
  elevations.push(...payload.elevation);
 }
 // Suppress nearest-cell stair steps while preserving a continuous closed lap.
 const weights=[1,2,3,2,1];
 const smoothed=elevations.map((_,index)=>weights.reduce((sum,weight,k)=>sum+weight*elevations[(index+k-2+sampleCount)%sampleCount],0)/9);
 const points=samples.map((sample,index)=>[Number(sample.east.toFixed(2)),Number(sample.north.toFixed(2)),Number(smoothed[index].toFixed(2))]);
 points.push([...points[0]]);
 const min=Math.min(...smoothed),max=Math.max(...smoothed);
 const file='/circuits/elevation/'+id+'.json';
 const profile={version:1,id,name:feature.properties.Name,points,source:{layout:layoutSource,elevation:'https://open-meteo.com/en/docs/elevation-api',dataset:'Copernicus DEM GLO-90',resolutionMeters:90,attribution:'Copernicus DEM / Open-Meteo',retrievedAt:new Date().toISOString(),smoothing:'Circular weighted average, five samples'}};
 fs.writeFileSync('public'+file,JSON.stringify(profile)+'\n');
 manifest[id]={file,sourceId:model.sourceId,minElevation:Number(min.toFixed(1)),maxElevation:Number(max.toFixed(1)),elevationRange:Number((max-min).toFixed(1)),lengthMeters:Math.round(length),source:'Copernicus DEM / Open-Meteo',resolutionMeters:90};
 console.log(feature.properties.Name+': '+manifest[id].minElevation+'–'+manifest[id].maxElevation+' m, range '+manifest[id].elevationRange+' m');
}
fs.writeFileSync('lib/circuit-elevation.json',JSON.stringify(manifest,null,2)+'\n');
console.log('Prepared '+Object.keys(manifest).length+' closed elevation profiles.');
