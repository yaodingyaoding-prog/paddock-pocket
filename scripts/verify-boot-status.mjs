import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';

const compiled = ts.transpileModule(fs.readFileSync('lib/boot-status.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const exports = {};
new Function('exports', compiled)(exports);
function boot(pathname = '/') {
  const events = new Map(), timers = new Map(), clicks = [];
  const notice = { hidden: true, dataset: {} };
  let reloads = 0;
  const window = {
    addEventListener: (name, fn) => events.set(name, fn),
    removeEventListener: name => events.delete(name),
  };
  const document = { getElementById: id => id === 'paddock-boot-status' ? notice : { addEventListener: (_, fn) => clicks.push(fn) } };
  vm.runInNewContext(exports.bootStatusScript, {
    window, document, location: { pathname, origin: 'https://xiaodinglab.com', reload: () => reloads++ },
    setTimeout: (fn, ms) => { timers.set(ms, fn); return ms; }, clearTimeout: id => timers.delete(id),
  });
  return { events, timers, notice, clicks, reloads: () => reloads };
}
const slow = boot();
assert.equal(slow.notice.hidden, true);
slow.timers.get(12000)();
assert.equal(slow.notice.hidden, false, 'Slow startup must not silently leave inert buttons');
slow.clicks[0]();
assert.equal(slow.reloads(), 1, 'Retry works before React loads');
slow.events.get('paddock:ready')();
assert.equal(slow.notice.hidden, true, 'Late successful startup clears the notice');

const normal = boot();
normal.events.get('paddock:ready')();
assert.equal(normal.timers.size, 0, 'Healthy startup cancels the watchdog');
assert.equal(normal.events.has('error'), false);
assert.equal(normal.notice.hidden, true);
for (const path of ['/about', '/privacy']) {
  const info = boot(path);
  assert.equal(info.timers.size, 0, 'Static information pages need no business-bundle watchdog');
  assert.equal(info.notice.hidden, true);
  assert.equal(info.events.size, 0);
}

const failed = boot();
failed.events.get('error')({ target: { tagName: 'SCRIPT', src: 'https://other.example/extension.js' } });
assert.equal(failed.notice.hidden, true, 'Unrelated extension errors must not accuse the app bundle');
failed.events.get('error')({ target: { tagName: 'SCRIPT', src: 'https://xiaodinglab.com/_next/static/chunks/framework.js' } });
assert.equal(failed.notice.dataset.reason, 'script-download');
assert.equal(failed.notice.hidden, false);
console.log('Startup checks passed: slow/failed bundles, pre-hydration retry, successful recovery, unrelated scripts.');
