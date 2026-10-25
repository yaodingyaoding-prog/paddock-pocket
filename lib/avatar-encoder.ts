import {stripAvatarMetadata} from './avatar-webp';
type Canvas=Pick<HTMLCanvasElement,'width'|'height'|'toBlob'|'getContext'>;
export type PortableAvatarEncoder=(image:ImageData)=>Promise<ArrayBuffer>;
let retryPortableInitialization=false;
async function portable(image:ImageData){
 const codec=await import('@jsquash/webp/encode.js');
 // A failed WASM download must be retryable without forcing the user to reload.
 if(retryPortableInitialization){await codec.init();retryPortableInitialization=false;}
 try{return await codec.default(image,{quality:82,method:4});}
 catch(error){retryPortableInitialization=true;throw error;}
}
function nativeWebp(canvas:Canvas):Promise<Blob|null>{
 return new Promise(resolve=>{
  let settled=false;const finish=(value:Blob|null)=>{if(settled)return;settled=true;clearTimeout(timer);resolve(value);};
  const timer=setTimeout(()=>finish(null),4000);
  try{if(typeof canvas.toBlob!=='function')finish(null);else canvas.toBlob(finish,'image/webp',.82);}catch{finish(null);}
 });
}
// Some WebKit canvases silently export PNG when WebP encoding is unavailable.
// Only the cropped pixels enter the optional local encoder; original files never leave the device.
export async function encodeAvatar(canvas:Canvas,fallback:PortableAvatarEncoder=portable):Promise<Blob>{
 if(canvas.width!==256||canvas.height!==256)throw Error('请先完成头像裁剪。');
 const native=await nativeWebp(canvas);
 let bytes:Uint8Array<ArrayBuffer>;
 try{
  if(native?.type==='image/webp')bytes=stripAvatarMetadata(new Uint8Array(await native.arrayBuffer()));
  else throw Error('Use portable encoder');
 }catch{
  const context=canvas.getContext('2d');if(!context)throw Error('暂时无法读取裁剪图片，请重新选图。');
  try{bytes=stripAvatarMetadata(new Uint8Array(await fallback(context.getImageData(0,0,256,256))));}
  catch{throw Error('头像图片生成失败，请重试；仍失败时可在 Safari 或 Chrome 中打开本站。');}
 }
 if(bytes.length>128*1024)throw Error('头像图片过大，请换一张图片重试。');
 return new Blob([bytes],{type:'image/webp'});
}
