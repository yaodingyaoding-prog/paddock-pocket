export type ViewingPlatform='ios'|'android'|'windows';
export function detectViewingPlatform(userAgent:string,platform='',maxTouchPoints=0):ViewingPlatform{
 if(/Android/i.test(userAgent))return 'android';
 if(/iPhone|iPad|iPod/i.test(userAgent)||platform==='MacIntel'&&maxTouchPoints>1)return 'ios';
 return 'windows';
}
export const tencentAppLink='txvideo://v.qq.com/VideoDetailActivity?isAutoPlay=0&cid=';
export function nativeAndroidAvailable(){return typeof window!=='undefined'&&((location.hostname==='f1.xiaodinglab.com'&&/PaddockPocket\//.test(navigator.userAgent))||(location.hostname==='appassets.androidplatform.net'&&!!document.querySelector('meta[name="paddock-native-token"]')));}
