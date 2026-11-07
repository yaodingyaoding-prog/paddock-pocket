import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
import {pathToFileURL} from 'node:url';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

assert.ok(fs.existsSync('lib/shopping.ts'), 'The researched shopping directory must exist');
await build({entryPoints:['lib/shopping.ts','app/shopping.tsx'],outdir:'.wrangler/checks/shopping',bundle:true,packages:'external',platform:'node',format:'esm',jsx:'automatic',loader:{'.css':'empty'},logLevel:'silent'});
const {shoppingChannels,filterShoppingChannels,shoppingCategories,shippingLabels}=await import(pathToFileURL(process.cwd()+'/.wrangler/checks/shopping/lib/shopping.js').href);
const {ShoppingDirectory}=await import(pathToFileURL(process.cwd()+'/.wrangler/checks/shopping/app/shopping.js').href);

assert.equal(shoppingChannels.length,17);
assert.equal(new Set(shoppingChannels.map(channel=>channel.id)).size,shoppingChannels.length);
for(const channel of shoppingChannels){
  assert.equal(new URL(channel.url).protocol,'https:');
  const destination=new URL(channel.url);
  assert.ok(!/^\/(?:en|zh|en\/home|html\/toys-pc)?\/?$/.test(destination.pathname),channel.name+' must open its F1 section, not a storefront homepage');
  assert.equal(new URL(channel.sourceUrl).protocol,'https:');
  assert.equal(channel.verifiedAt,'2026-11-05');
  assert.ok(channel.categories.length && channel.categories.every(category=>Object.hasOwn(shoppingCategories,category)));
  assert.ok(Object.hasOwn(shippingLabels,channel.shipping));
  assert.ok(channel.description && channel.shippingNote && channel.keywords.length);
}
for(const id of ['puma','adidas','rastar']) {
  const destination=new URL(shoppingChannels.find(channel=>channel.id===id).url);
  assert.equal(destination.searchParams.get('keyword'),'F1',id+' must open the store F1 product results');
}
assert.equal(new URL(shoppingChannels.find(channel=>channel.id==='mclaren').url).pathname,'/en/formula1/team/');
assert.equal(new URL(shoppingChannels.find(channel=>channel.id==='ck-modelcars').url).pathname,'/en/l/t-gesamt/k-formel1/');
assert.equal(new URL(shoppingChannels.find(channel=>channel.id==='diecast-legends').url).pathname,'/f1-models');
assert.equal(filterShoppingChannels(shoppingChannels,{}).length,17);
assert.equal(filterShoppingChannels(shoppingChannels,{region:'domestic'}).length,4);
assert.equal(filterShoppingChannels(shoppingChannels,{region:'overseas'}).length,13);
assert.deepEqual(filterShoppingChannels(shoppingChannels,{query:'  PUMA 法拉利  '}).map(channel=>channel.id),['puma']);
assert.deepEqual(filterShoppingChannels(shoppingChannels,{query:'mClArEn',region:'domestic'}).map(channel=>channel.id),['puma','lego']);
assert.deepEqual(filterShoppingChannels(shoppingChannels,{query:'奔驰',category:'models',region:'domestic'}).map(channel=>channel.id),['lego','rastar']);
assert.equal(filterShoppingChannels(shoppingChannels,{region:'domestic',shipping:'mainland'}).length,0);
assert.equal(filterShoppingChannels(shoppingChannels,{query:'xyz-no-channel'}).length,0);
assert.equal(shoppingChannels.find(channel=>channel.id==='redbull').shipping,'unlisted');
assert.equal(shoppingChannels.find(channel=>channel.id==='gpworld').shipping,'contact');
assert.equal(shoppingChannels.find(channel=>channel.id==='fuel-for-fans').shipping,'checkout');
assert.ok(shoppingChannels.find(channel=>channel.id==='ck-modelcars').shippingNote.includes('59.95'));

const html=renderToStaticMarkup(createElement(ShoppingDirectory));
assert.equal((html.match(/class="shopping-channel"/g)||[]).length,17);
assert.ok(html.includes('搜索购买渠道'));
assert.ok(!html.includes('筛选配送方式'));
for(const copy of ['核验于','核验来源','配送标记与购买说明','需结账确认','大陆未列配送','税费','试试其他车队']) {
  assert.ok(!html.includes(copy),'The directory must omit advisory copy: '+copy);
}
assert.equal((html.match(/data-featured="true"/g)||[]).length,3);
assert.equal((html.match(/class="shopping-visit"/g)||[]).length,17);
for(const channel of shoppingChannels){
  assert.ok(html.includes(channel.url.replaceAll('&','&amp;')));
  assert.ok(html.includes(channel.name));
}
for(const anchor of html.matchAll(/<a\b[^>]*>/g)){
  assert.ok(anchor[0].includes('target="_blank"'));
  assert.ok(anchor[0].includes('rel="noopener noreferrer"'));
}
const navigation=fs.readFileSync('app/paddock-navigation.tsx','utf8');
assert.match(navigation,/shopping:\{title:'周边购买'/);
assert.match(navigation,/onOpen\('shopping'\)/);
assert.match(fs.readFileSync('app/paddock-app.tsx','utf8'),/detail==='shopping'\?<ShoppingDirectory\/>/);
console.log('Shopping: 17 unique channels, combined filters, three feature entries, advisory copy removal, safe links and Discover route passed.');
