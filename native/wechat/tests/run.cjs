const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..'), mini = path.join(root, 'miniprogram'), config = require('../miniprogram/lib/config'), { createApi } = require('../miniprogram/lib/api'), { createStore, defaults } = require('../miniprogram/lib/store'), fmt = require('../miniprogram/lib/format'), { resource, seed } = require('../miniprogram/lib/data'), { createAvatarFiles } = require('../miniprogram/lib/avatar');
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
const pause = () => new Promise(r => setImmediate(r));
function fakeWx(handler, storage = {}) { const calls = []; return { calls, storage, getStorageSync: k => storage[k], setStorageSync(k, v) { storage[k] = structuredClone(v); }, removeStorageSync(k) { delete storage[k]; }, request(options) { calls.push(options); Promise.resolve().then(() => handler(options)).then(value => { if (value.network)
        options.fail({ errMsg: 'test network' });
    else
        options.success({ statusCode: 200, header: {}, ...value }); }).catch(error => options.fail(error)); } }; }
function cloud() { let owner = 'a', records = { a: { ...defaults() }, b: { ...defaults() } }, failed = false, logoutFailed = false, cleared = 0; const api = { async request(url, o = {}) { if (url.endsWith('/session'))
        return { user: owner ? { id: owner, name: 'Test' } : null }; if (url.endsWith('/preferences')) {
        if (failed)
            throw Error('offline');
        if (o.method === 'PATCH')
            records[owner] = { ...records[owner], ...o.data.patch };
        return { record: { preferences: structuredClone(records[owner]), revision: 1 } };
    } if (url.endsWith('/logout')) {
        if (logoutFailed)
            throw Error('offline');
        owner = null;
        return {};
    } if (url.endsWith('/login'))
        return { user: { id: owner, name: 'Test' } }; throw Error(url); }, clearSession() { cleared++; } }; return { api, records, setOwner: v => owner = v, fail: v => failed = v, failLogout: v => logoutFailed = v, cleared: () => cleared }; }
test('All configured pages, local requires, WXML tags, handlers, icons and size', () => { const app = JSON.parse(fs.readFileSync(path.join(mini, 'app.json'))), project = JSON.parse(fs.readFileSync(path.join(root, 'project.config.json'))); assert.equal(project.setting.urlCheck, true); assert.equal(project.appid, undefined); assert.equal(app.pages.length, 10); const tags = new Set(['view', 'text', 'block', 'image', 'button', 'picker', 'input', 'checkbox', 'checkbox-group', 'label']); for (const page of app.pages) {
    for (const ext of ['js', 'wxml', 'json'])
        assert(fs.existsSync(path.join(mini, page + '.' + ext)), page + '.' + ext);
    let definition;
    const file = path.join(mini, page + '.js');
    vm.runInNewContext(fs.readFileSync(file, 'utf8'), { Page: v => definition = v, require: createRequire(file) }, { filename: file });
    assert(definition && definition.data);
    const wxml = fs.readFileSync(path.join(mini, page + '.wxml'), 'utf8');
    const markup = wxml.replace(/\{\{[\s\S]*?\}\}/g, 'EXPR'), stack = [];
    for (const token of markup.matchAll(/<\/?([a-z-]+)\b[^>]*>/g)) {
        const [tag, name] = token;
        assert(tags.has(name), 'unsupported tag ' + name);
        if (tag.startsWith('</'))
            assert.equal(stack.pop(), name, page);
        else if (!tag.endsWith('/>'))
            stack.push(name);
    }
    assert.deepEqual(stack, [], page);
    for (const event of wxml.matchAll(/(?:bind|catch)(?:tap|change|input|error)="([\w]+)"/g))
        assert.equal(typeof definition[event[1]], 'function', page + ' handler ' + event[1]);
    assert(!/<(?:web-view|a|div|br|script)\b/.test(wxml));
} let bytes = 0; function walk(dir) { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory())
        walk(file);
    else {
        bytes += fs.statSync(file).size;
        if (entry.name.endsWith('.js')) {
            const source = fs.readFileSync(file, 'utf8');
            new vm.Script(source, { filename: file });
            for (const match of source.matchAll(/require\(['"]([^'"]+)['"]\)/g)) {
                assert(match[1].startsWith('.'));
                assert(fs.existsSync(path.resolve(path.dirname(file), match[1] + '.js')), file + ' require ' + match[1]);
            }
            assert(!/\b(?:window|document|localStorage)\./.test(source));
            assert(!/sb_secret_|service_role|re_[A-Za-z0-9]{20,}/.test(source));
        }
    }
} } walk(mini); for (const item of app.tabBar.list)
    for (const key of ['iconPath', 'selectedIconPath'])
        assert(fs.existsSync(path.join(mini, item[key]))); assert(bytes < 2 * 1024 * 1024); console.log('   Native package bytes: ' + bytes); });
test('Native cookie chunk capture, empty cookies fallback, Expires and expiry', async () => { let now = 100000; const wx = fakeWx(() => ({ data: { user: null }, cookies: [], header: { 'Set-Cookie': 'sb-test-auth-token.0=one; Path=/; Max-Age=60, sb-test-auth-token.1=two; Expires=Wed, 01 Jan 2031 00:00:00 GMT; Secure' } }), { [config.sessionKey]: { 'sb-bad': null } }), api = createApi(wx, () => now); await api.request('/api/auth/session'); assert(api.cookieHeader().includes('sb-test-auth-token.0=one')); assert(api.cookieHeader().includes('sb-test-auth-token.1=two')); now += 61000; assert(!api.cookieHeader().includes('.0=one')); assert(api.cookieHeader().includes('.1=two')); api.clearSession(); assert.equal(api.cookieHeader(), ''); assert.equal(wx.storage[config.sessionKey], undefined); });
test('Reject foreign-domain cookies; private cookies never accompany public data', async () => { const wx = fakeWx(o => ({ cookies: ['sb-good=ok; Domain=f1.xiaodinglab.com; Path=/', 'sb-bad=no; Domain=evil.example', 'unrelated=no'], data: { user: null } })), api = createApi(wx); await api.request('/api/auth/session'); assert.equal(api.cookieHeader(), 'sb-good=ok'); await api.request('/api/news'); assert.equal(wx.calls[1].header.Cookie, undefined); await api.request('/api/auth/login', { method: 'POST', data: {} }); assert.equal(wx.calls[2].header.Origin, config.site); assert.equal(wx.calls[2].header.Cookie, 'sb-good=ok'); await assert.rejects(() => api.request('https://evil.example/api/auth/login')); await assert.rejects(() => api.request('/api/auth/../news')); });
test('Auth requests serialize and are not retried on rate limits or connection errors', async () => { let active = 0, max = 0; const wx = fakeWx(async (o) => { max = Math.max(max, ++active); await pause(); active--; return { statusCode: o.url.endsWith('/login') ? 429 : 200, data: { error: '操作频繁' } }; }), api = createApi(wx); await Promise.allSettled([api.request('/api/auth/login', { method: 'POST' }), api.request('/api/auth/session')]); assert.equal(max, 1); assert.equal(wx.calls.length, 2); const failed = fakeWx(() => ({ network: true })); await assert.rejects(() => createApi(failed).request('/api/auth/login', { method: 'POST' })); assert.equal(failed.calls.length, 1); });
test('Public retry is bounded, cache retains original timestamp and no 429 retry', async () => { let online = true; const wx = fakeWx(() => online ? { data: { data: { items: [] }, updatedAt: '2026-01-01' } } : { network: true }), api = createApi(wx); await api.publicRead('/api/data?resource=races'); online = false; const saved = await api.publicRead('/api/data?resource=races'); assert.equal(wx.calls.length, 3); assert.equal(saved.source, 'cache'); assert.equal(saved.updatedAt, '2026-01-01'); const limited = fakeWx(() => ({ statusCode: 429, data: { error: 'limited' } })); await assert.rejects(() => createApi(limited).publicRead('/api/data?resource=teams')); assert.equal(limited.calls.length, 1); await assert.rejects(() => api.publicRead('/api/auth/preferences')); });
test('Historical seasons never receive the current-season snapshot', async () => { const api = createApi(fakeWx(() => ({ network: true }))); assert.equal((await resource(api, 'races')).source, 'snapshot'); await assert.rejects(() => resource(api, 'races', 'different-season')); });
test('Cloud preferences synchronize between independent client stores', async () => { const backend = cloud(), a = createStore(backend.api), b = createStore(backend.api); await Promise.all([a.refresh(), b.refresh()]); await a.save({ theme: 'ice', accent: 'purple', timezone: 'Europe/London' }); await b.refresh(); assert.equal(b.get().preferences.theme, 'ice'); assert.equal(b.get().preferences.accent, 'purple'); assert.equal(b.get().preferences.timezone, 'Europe/London'); });
test('Rapid following writes merge; fourth driver rejected; teams separate', async () => { const backend = cloud(), s = createStore(backend.api); await s.refresh(); await Promise.all([s.toggle('one'), s.toggle('two'), s.toggle('three')]); assert.deepEqual(s.get().preferences.driverIds, ['one', 'two', 'three']); await assert.rejects(() => s.toggle('four')); await s.toggle('mercedes', true); assert.deepEqual(s.get().preferences.teamIds, ['mercedes']); await s.toggle('one'); assert.deepEqual(s.get().preferences.driverIds, ['two', 'three']); });
test('Failed cloud writes and logout preserve confirmed account state', async () => { const backend = cloud(), s = createStore(backend.api); await s.refresh(); await s.save({ theme: 'plum' }); backend.fail(true); await assert.rejects(() => s.save({ theme: 'ice' })); assert.equal(s.get().preferences.theme, 'plum'); backend.fail(false); backend.failLogout(true); await assert.rejects(() => s.logout()); assert.equal(s.get().user.id, 'a'); assert.equal(backend.cleared(), 0); backend.failLogout(false); await s.logout(); assert.equal(s.get().user, null); assert.equal(s.get().preferences.driverIds.length, 0); assert.equal(backend.cleared(), 1); });
test('Unavailable account is distinct from guest; switching users does not retain preferences', async () => { const broken = createStore({ request: async () => { throw Error('offline'); } }); await broken.refresh(); assert.equal(broken.get().accountState, 'unavailable'); await assert.rejects(() => broken.save({ theme: 'ice' })); const backend = cloud(), s = createStore(backend.api); await s.refresh(); await s.save({ driverIds: ['one'], theme: 'ice' }); backend.setOwner('b'); await s.refresh(); assert.equal(s.get().user.id, 'b'); assert.deepEqual(s.get().preferences.driverIds, []); assert.equal(s.get().preferences.theme, 'dark'); });
test('Private avatar file is removed on replacement and logout', async () => { const files = new Map(), platform = { env: { USER_DATA_PATH: '/private' }, getFileSystemManager: () => ({ writeFile(o) { files.set(o.filePath, o.data); o.success(); }, unlinkSync(f) { files.delete(f); } }) }, avatars = createAvatarFiles(platform), api = { request: async () => new Uint8Array([1, 2]).buffer }; await avatars.load(api); assert.equal(files.size, 1); await avatars.load(api); assert.equal(files.size, 1); avatars.clear(); assert.equal(files.size, 0); });
test('Forecasts match the chosen session and label ended / out-of-range / cached data', () => { const now = Date.parse('2026-10-26T10:00:00Z'), start = now + 3600000, race = { schedule: [{ id: 'race', type: 'MainRace', sessionName: '正赛', startDate: new Date(start).toISOString(), endDate: new Date(start + 7200000).toISOString() }] }, entry = { data: { timezone: 'UTC', current: { temperature_2m: 21.8, weather_code: 3, wind_speed_10m: 12 }, hourly: { time: [start / 1000], temperature_2m: [23], precipitation_probability: [60] } }, fetchedAt: now, source: 'cache' }; const view = fmt.weatherView(entry, race, 'race', now); assert.equal(view.forecast, '23° · 降水 60%'); assert.equal(view.stale, true); assert.equal(fmt.weatherView(entry, race, 'race', start + 8000000).forecast, '该场次已结束'); assert.equal(fmt.weatherView({ ...entry, data: { ...entry.data, hourly: { time: [] } } }, race, 'race', now).forecast, '尚未进入预报范围'); });
test('Season standings, canonical team follows, portraits and race result statuses', () => { assert.equal(fmt.teamKey({ teamShortName: '红牛二队' }), 'racingbulls'); assert.equal(fmt.teamKey({ teamName: '梅赛德斯' }), 'mercedes'); assert.equal(fmt.result({ result: { position: 2, gapToLeader: '3.2' } }), '+3.2'); assert.equal(fmt.result({ result: { resultStatus: 'Dsq' } }), '取消资格'); assert.equal(fmt.result({ result: { resultStatus: 'Dnf' } }), 'DNF'); assert.equal(fmt.result({ q1: '1:30', q2: '1:29' }), '1:29'); const historic = Object.keys(seed.history.ids).find(id => !seed.portraits[id]); assert(fmt.portrait({ driverId: historic }).startsWith(config.site + '/drivers/history/')); assert(fmt.portrait({driverName:'塞巴斯蒂安·维特尔'}).includes('/drivers/history/vettel'));for(const team of fmt.standing(seed.teams))assert(fs.existsSync(path.join(mini,'assets/cars',fmt.teamKey(team)+'.webp')));assert(seed.seasons.items.length > 50); });
(async () => { let failed = 0; for (const item of tests)
    try {
        await item.fn();
        console.log('PASS ' + item.name);
    }
    catch (error) {
        failed++;
        console.error('FAIL ' + item.name + '\n' + error.stack);
    } console.log(JSON.stringify({ checks: tests.length, passed: tests.length - failed, failed, scope: 'Node contracts and source structure; not WeChat compile or physical-device acceptance' })); process.exitCode = failed ? 1 : 0; })();
