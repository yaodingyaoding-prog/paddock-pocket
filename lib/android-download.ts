import release from '../public/downloads/android-build.json';
type AssetBinding = { fetch(request: Request): Promise<Response> };
// Stream the public APK through an explicit attachment endpoint; never read it into worker memory.
export async function androidDownload(request: Request, assets: AssetBinding) {
  const url = new URL(request.url); url.pathname = release.download; url.search = '';
  const headers = new Headers();
  for (const name of ['range','if-range']) { const value=request.headers.get(name); if(value)headers.set(name,value); }
  const asset = await assets.fetch(new Request(url, { method: request.method==='HEAD'?'HEAD':'GET', headers }));
  if (![200,206,416].includes(asset.status)) return new Response('安装包暂时不可用，请返回下载页重试。', {status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
  const outgoing = new Headers(asset.headers);
  outgoing.set('Content-Type','application/vnd.android.package-archive');
  outgoing.set('Content-Disposition','attachment; filename="Paddock-Pocket-'+release.version+'.apk"');
  outgoing.set('X-Content-Type-Options','nosniff'); outgoing.set('Cache-Control','no-store');
  return new Response(request.method==='HEAD'?null:asset.body,{status:asset.status,headers:outgoing});
}
