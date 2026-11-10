import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {readFileSync,existsSync} from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright-core');
await build({entryPoints:['scripts/first-visit-browser-fixture.tsx'],outdir:'.wrangler/checks/first-visit-browser',bundle:true,splitting:true,format:'esm',platform:'browser',jsx:'automatic',logLevel:'silent',define:{'process.env.NODE_ENV':'"production"'}});
const html='<html><head><link rel="stylesheet" href="/circuit.css"><style>body{--panel:#f4efe6;--text:#27313a;--muted:#66767c;--accent:#008b78;font-family:system-ui}.circuit-preview{width:340px;height:260px}.track-scene,.track-scene>div{position:relative;width:100%;height:100%}.track-scene.large{height:350px}.track-scene canvas{display:block}dialog{width:370px}</style></head><body><div id="root"></div><script type="module" src="/first-visit-browser-fixture.js"></script></body></html>';
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:393,height:852}}),requests=[];
 await page.route('https://first-visit.test/**',route=>{
  const path=new URL(route.request().url()).pathname;
  if(path==='/')return route.fulfill({contentType:'text/html',body:html});
  if(path==='/circuit.css')return route.fulfill({contentType:'text/css',body:readFileSync('app/race-design.css')});
  if(/^\/[\w.-]+\.js$/.test(path)&&existsSync('.wrangler/checks/first-visit-browser'+path))return route.fulfill({contentType:'text/javascript',body:readFileSync('.wrangler/checks/first-visit-browser'+path)});
  if(path.startsWith('/circuits/')&&existsSync('public'+path))return route.fulfill({contentType:path.endsWith('.json')?'application/json':'image/webp',body:readFileSync('public'+path)});
  return route.fulfill({status:404,body:'Missing fixture resource'});
 });
 page.on('request',r=>requests.push(r.url()));
 await page.goto('https://first-visit.test/');
 await page.getByRole('button',{name:'重置视角'}).waitFor({timeout:5000});
 assert.equal(await page.getByRole('button',{name:'启用 3D'}).count(),0,'The circuit must not require an enable click');
 assert.ok(requests.some(url=>url.includes('/circuits/elevation/')),'3D must automatically fetch its elevation profile');
 assert.equal(requests.some(url=>/\/circuits\/[^/]+\.webp$/.test(url)),false,'3D startup must not request a flat track image');
 assert.equal(await page.locator('.track-scene canvas').count(),1,'Automatic startup must produce a real WebGL canvas');
 const modelCanvas=page.locator('.circuit-preview canvas');
 const capture=(canvas=modelCanvas)=>canvas.screenshot({animations:'allow'});
 async function waitForMotion(before,canvas=modelCanvas){
  const start=Date.now();
  while(Date.now()-start<4000){await page.waitForTimeout(100);if(!before.equals(await capture(canvas)))return;}
  assert.fail('The actual rendered circuit must keep rotating');
 }
 const initialPosition=await capture();
 await waitForMotion(initialPosition);
 const canvas=await page.locator('.track-scene canvas').boundingBox();
 const beforeDrag=await capture();
 await page.mouse.move(canvas.x+canvas.width/2,canvas.y+canvas.height/2);
 await page.mouse.down();
 await page.mouse.move(canvas.x+canvas.width*.75,canvas.y+canvas.height*.35,{steps:12});
 assert.ok(!beforeDrag.equals(await capture()),'Dragging must take control of the rotating circuit');
 let heldPosition=await capture(),stableFrames=0;
 const settleStart=Date.now();
 while(stableFrames<3&&Date.now()-settleStart<12000){
  await page.waitForTimeout(100);
  const current=await capture();
  stableFrames=current.equals(heldPosition)?stableFrames+1:0;
  heldPosition=current;
 }
 assert.equal(stableFrames,3,'Damping must settle while the pointer holds the drag');
 await page.waitForTimeout(250);
 assert.ok(heldPosition.equals(await capture()),'Automatic rotation must pause while the user holds the drag');
 await page.mouse.up();
 await waitForMotion(heldPosition);
 await page.getByRole('button',{name:'重置视角'}).click();
 const resetPosition=await capture();
 await waitForMotion(resetPosition);
 console.log('Circuit rotation: automatic motion, manual drag, held-pointer pause, release resume and reset passed.');
 assert.equal(await page.getByRole('combobox',{name:'高度显示比例'}).count(),0,'Only the original scale is available, without a scale selector');
 assert.equal(await page.locator('.circuit-elevation-pin').count(),0,'The model must not display explanatory elevation labels');
 await page.getByRole('button',{name:/放大.*3D赛道/}).click();
 const circuitDialog=page.getByRole('dialog');
 await circuitDialog.getByRole('button',{name:'重置视角'}).waitFor();
 const dialogCanvas=circuitDialog.locator('canvas');
 const dialogPosition=await capture(dialogCanvas);
 await waitForMotion(dialogPosition,dialogCanvas);
 assert.equal(await circuitDialog.locator('select,.circuit-elevation-pin').count(),0,'The enlarged model must also omit scale controls and explanatory text');
 await circuitDialog.getByRole('button',{name:'关闭',exact:true}).click();
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
 // Unsupported WebGL must expose retry without substituting a flat image.
 await page.addInitScript(()=>{HTMLCanvasElement.prototype.getContext=()=>null;});
 await page.reload();
 await page.getByRole('button',{name:'重试 3D'}).waitFor();
 assert.equal(await page.locator('.circuit-preview img').count(),0,'A failed 3D viewer must not insert a flat image');
 await page.getByRole('button',{name:'重新加载此页面'}).waitFor();
 const stalled=[];
 await page.route('**/three.module-*.js',route=>{stalled.push(route);});
 await Promise.all([page.waitForEvent('domcontentloaded'),page.getByRole('button',{name:'重新加载此页面'}).click()]);
 await page.getByRole('button',{name:'重试 3D'}).waitFor({timeout:18000});
 assert.ok(stalled.length>0,'The timeout case must stall the actual engine module download');
 for(const route of stalled)await route.abort();
 console.log('Browser recovery: automatic WebGL/model loading, failed module isolation, navigation, document retry and 3D fallback passed.');
}finally{await browser.close();}
