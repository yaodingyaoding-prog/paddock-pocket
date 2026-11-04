import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFileSync,existsSync} from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
await build({entryPoints:['scripts/first-visit-browser-fixture.tsx'],outdir:'.wrangler/checks/first-visit-browser',bundle:true,splitting:true,format:'esm',platform:'browser',jsx:'automatic',logLevel:'silent',define:{'process.env.NODE_ENV':'"production"'}});
const html='<html><body><div id="root"></div><script type="module" src="/first-visit-browser-fixture.js"></script></body></html>';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const page=await browser.newPage({viewport:{width:393,height:852}}),requests=[];
 await page.route('https://first-visit.test/**',route=>{
  const path=new URL(route.request().url()).pathname;
  if(path==='/')return route.fulfill({contentType:'text/html',body:html});
  if(/^\/[\w.-]+\.js$/.test(path)&&existsSync('.wrangler/checks/first-visit-browser'+path))return route.fulfill({contentType:'text/javascript',body:readFileSync('.wrangler/checks/first-visit-browser'+path)});
  if(path.startsWith('/circuits/')&&existsSync('public'+path))return route.fulfill({contentType:'image/webp',body:readFileSync('public'+path)});
  return route.fulfill({status:404,body:'Missing fixture resource'});
 });
 page.on('request',r=>requests.push(r.url()));
 await page.goto('https://first-visit.test/');
 await page.getByRole('button',{name:'重新加载此页面'}).waitFor();
 assert.equal(await page.getByRole('button',{name:'返回赛程'}).isVisible(),true,'A failed module must leave navigation usable');
 await page.getByRole('button',{name:'返回赛程'}).click();
 await page.getByText('赛程正常显示').waitFor();
 assert.equal(await page.getByRole('button',{name:'重新加载此页面'}).count(),0,'Navigating away must recover from the failed module');
 await page.evaluate(()=>{HTMLDialogElement.prototype.showModal=undefined;HTMLDialogElement.prototype.close=undefined;});
 await page.getByRole('button',{name:'打开资料'}).click();
 await page.getByRole('dialog',{name:'资料'}).waitFor({timeout:3000});
 await page.getByRole('button',{name:'关闭',exact:true}).click();
 assert.equal(await page.getByRole('dialog').count(),0,'An unsupported dialog API or failed panel must not trap navigation');
 await page.getByRole('button',{name:'启用 3D'}).waitFor();
 assert.equal(await page.locator('img.circuit-flat-preview').evaluate(image=>image.complete&&image.naturalWidth>0),true,'The static preview must actually decode');
 assert.equal(requests.some(url=>url.endsWith('.stl')),false,'First paint must not fetch 3D models');
 // A real unsupported WebGL context must leave the static preview and recovery action.
 await page.evaluate(()=>{HTMLCanvasElement.prototype.getContext=()=>null;});
 await page.getByRole('button',{name:'启用 3D',exact:true}).click();
 await page.getByRole('button',{name:'重试 3D'}).waitFor();
 assert.equal(await page.locator('img.circuit-flat-preview').count(),1,'Failed WebGL must retain the static circuit image');
 await page.reload();
 await page.getByRole('button',{name:'重新加载此页面'}).waitFor();
 await Promise.all([page.waitForEvent('domcontentloaded'),page.getByRole('button',{name:'重新加载此页面'}).click()]);
 const stalled=[];
 await page.route('**/three.module-*.js',route=>{stalled.push(route);});
 await page.getByRole('button',{name:'启用 3D',exact:true}).click();
 await page.getByRole('button',{name:'重试 3D'}).waitFor({timeout:18000});
 assert.ok(stalled.length>0,'The timeout case must stall the actual engine module download');
 for(const route of stalled)await route.abort();
 console.log('Browser recovery: failed module isolation, working navigation, document retry, opt-in 3D and WebGL fallback passed.');
}finally{await browser.close();}
