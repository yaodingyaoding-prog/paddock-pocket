// Page-lifecycle tests use a fake native host; they do not replace WeChat DevTools.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), { createRequire } = require('node:module'), { seed } = require('../miniprogram/lib/data'), { createStore } = require('../miniprogram/lib/store');
const flush = async () => { for (let i = 0; i < 8; i++)
    await new Promise(r => setImmediate(r)); };
const savedWx = global.wx, savedApp = global.getApp, actions = [];
let failPublic = false, authCalls = 0, publicCalls = [];
const forecast = { data: { timezone: 'UTC', current: { temperature_2m: 20, weather_code: 0, wind_speed_10m: 3 }, hourly: { time: [], temperature_2m: [], precipitation_probability: [] } }, fetchedAt: Date.now() };
const api = { async publicRead(url, fallback) { publicCalls.push(url); if (failPublic)
        throw Error('offline'); if (url.startsWith('/api/weather'))
        return forecast; if (fallback)
        return fallback; throw Error('missing fixture ' + url); }, async request(url, o = {}) { if (url === '/api/news')
        return { items: seed.news, checkedAt: new Date().toISOString() }; if (url.startsWith('/api/drivers/'))
        return { data: { name: '测试车手', career: { starts: 10, wins: 1, podiums: 2, poles: 1, titles: 0 }, history: [] } }; if (url === '/api/auth/session')
        return { user: null }; if (url === '/api/auth/register') { assert.deepEqual(Object.keys(o.data).sort(),['email','name','password']); return {user:{id:'test',name:'Tester'}}; } if (url === '/api/auth/login') {
        assert.deepEqual(Object.keys(o.data).sort(),['email','password','remember']);
        authCalls++;
        return { user: { id: 'test', name: 'Tester' } };
    } if (url === '/api/auth/preferences')
        return { record: null }; if (url === '/api/auth/forgot')
        return { message: 'sent' }; throw Error(url); }, clearSession() { } };
const app = { api, store: createStore(api) }, platform = { navigateTo: o => actions.push(['navigate', o.url]), switchTab: o => actions.push(['tab', o.url]), stopPullDownRefresh() { }, pageScrollTo() { }, showModal() { }, showToast() { }, setClipboardData: o => { actions.push(['copy', o.data]); if (o.success)
        o.success(); }, env: { USER_DATA_PATH: '/private' }, getFileSystemManager: () => ({ unlinkSync() { }, writeFile(o) { o.success(); } }) };
global.wx = platform;
global.getApp = () => app;
function page(name, options = {}) { let definition; const file = path.resolve(__dirname, '../miniprogram/pages', name, 'index.js'); vm.runInNewContext(fs.readFileSync(file, 'utf8'), { Page: d => definition = d, require: createRequire(file), wx: platform, getApp: () => app, setInterval: () => 1, clearInterval() { } }, { filename: file }); const instance = { ...definition, data: structuredClone(definition.data), setData(patch) { Object.assign(this.data, patch); } }; if (instance.onLoad)
    instance.onLoad(options); instance.onShow(); return instance; }
const event = (dataset = {}, value = '') => ({ currentTarget: { dataset }, detail: { value } });
(async () => {
    let checks = 0;
    try {
        const schedule = page('schedule');
        assert(publicCalls[0].startsWith('/api/weather?'), 'weather must start before waiting for schedule requests');
        await flush();
        assert(schedule.data.sessions.length > 0);
        assert(schedule.data.race.id);
        assert(schedule.data.track);
        assert(schedule.data.weather);
        assert(schedule.onShareAppMessage().path.startsWith('/pages/schedule/index?'));
        schedule.showCalendar();
        assert(schedule.data.calendar);
        schedule.selectRace(event({ id: schedule.data.races[1].id }));
        assert.equal(schedule.data.race.id, schedule.data.races[1].id);
        schedule.results(event({ id: schedule.data.sessions[0].id }));
        assert(actions.some(a => a[0] === 'navigate' && a[1].includes('/pages/results/')));
        checks++;
        failPublic = true;
        schedule.changeSeason(event({}, '1'));
        await flush();
        assert.equal(schedule.data.race, null);
        assert.equal(schedule.data.races.length, 0);
        assert(schedule.data.error.includes('暂时'));
        schedule.onHide();
        failPublic = false;
        checks++;
        const rankings = page('rankings');
        await flush();
        assert.equal(rankings.data.rows.length, 5);
        rankings.expand();
        assert(rankings.data.rows.length > 5);
        rankings.switchKind(event({ kind: 'teams' }));
        await flush();
        assert(rankings.data.rows[0].car.endsWith('.webp'));
        rankings.onHide();
        checks++;
        const driver = page('driver', { id: seed.drivers.items[0].standings[0].driverId, season: seed.season });
        await flush();
        assert.equal(driver.data.stats.length, 5);
        assert(driver.data.driver.driverName);
        driver.onHide();
        checks++;
        const resultPage=page('results',{title:encodeURIComponent('正赛'),start:encodeURIComponent(new Date(Date.now()+3600000).toISOString())});
        assert.equal(resultPage.data.title,'正赛');assert.equal(resultPage.data.pending,true);resultPage.onHide();checks++;
        const discover = page('discover');
        await flush();
        assert(discover.data.items.length >= 3);
        discover.replays();
        discover.watch(event({ kind: 'smg' }));
        assert(actions.some(a => a[0] === 'copy' && a[1].includes('kankanews.com')));
        discover.onHide();
        assert.equal(discover.data.busy, false);
        discover.onShow();
        await flush();
        assert.equal(discover.data.busy, false);
        discover.onHide();
        checks++;
        const article = page('article', { id: seed.news[0].id });
        await flush();
        assert(article.data.paragraphs.length > 0);
        article.onHide();
        const replays = page('replays');
        await flush();
        assert(replays.data.races.length > 0);
        replays.search(event({}, '不存在的分站'));
        assert.equal(replays.data.races.length, 0);
        replays.search(event({}, ''));
        replays.copy(event({ id: replays.data.races[0].id, platform: 'bilibili' }));
        assert(actions.some(a => a[0] === 'copy' && a[1].includes('search.bilibili.com')));
        replays.onHide();
        checks++;
        const auth = page('auth');
        auth.input(event({ field: 'email' }, 'test@example.test'));
        auth.input(event({ field: 'password' }, 'secret123'));
        assert.equal(authCalls, 0);
        auth.agree(event({}, ['yes']));
        await auth.submit();
        assert.equal(authCalls, 1);
        assert.equal(auth.data.password, '');
        assert(actions.some(a => a[0] === 'tab' && a[1] === '/pages/profile/index'));
        auth.onHide();
        checks++;
        const register=page('auth',{mode:'register'});
        register.input(event({field:'name'},'Tester'));
        register.input(event({field:'email'},'test@example.test'));
        register.input(event({field:'password'},'secret123'));
        register.agree(event({},['yes']));
        await register.submit();
        assert.equal(register.data.error,'');
        assert.equal(register.data.password,'');
        register.onHide();checks++;
        const profile = page('profile');
        await flush();
        assert.equal(profile.data.podium.length, 3);
        assert.equal(profile.data.themes.length, 10);
        assert(profile.data.zones.length > 300);
        profile.searchZone(event({}, 'Shanghai'));
        assert(profile.data.zones.includes('Asia/Shanghai'));
        profile.onUnload();
        checks++;
        console.log(JSON.stringify({ checks, passed: checks, scope: 'Mock native page lifecycle and actions, not WeChat rendering' }));
    }
    finally {
        global.wx = savedWx;
        global.getApp = savedApp;
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
