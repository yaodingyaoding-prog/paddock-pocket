const { seed, query, resource } = require('../../lib/data'), fmt = require('../../lib/format'), ui = require('../../lib/page');
function cadence(sessions, now) { const times = sessions.map(s => ({ start: Date.parse(s.startDate), end: Date.parse(s.endDate || s.startDate) + (!s.endDate ? 7200000 : 0) })); if (times.some(s => now >= s.start - 1800000 && now <= s.end + 1800000))
    return 300000; if (times.some(s => s.start > now && s.start - now < 172800000))
    return 3600000; return 10800000; }
Page({
    data: { skin: '', error: '', busy: false, calendar: false, season: seed.season, seasons: seed.seasons.items, seasonIndex: 0, race: seed.next, races: seed.races.items, sessions: [], weather: null, weatherLoading: false, weatherError: '', weatherIndex: 0, track: '', stamp: '最近保存 · ' + fmt.date(seed.updatedAt), countdown: '' },
    onLoad(options) { this._desiredRace = options.race || ''; if (options.season && /^[a-f0-9-]{36}$/i.test(options.season))
        this.setData({ season: options.season }); },
    onShow() { ui.attach(this, () => this.renderRace()); if (this.data.season === seed.season && this.data.race) void this.loadWeather(); void this.refresh(); this._timer = setInterval(() => { this.renderRace(); if (Date.now() - (this._weatherAt || 0) >= cadence(this.data.race && this.data.race.schedule || [], Date.now()))
        void this.loadWeather(); }, 60000); },
    onHide() { ui.detach(this); clearInterval(this._timer); this._version = (this._version || 0) + 1; }, onUnload() { this.onHide(); },
    async onPullDownRefresh() { await this.refresh(); ui.stopRefresh(); },
    async refresh() {
        const version = this._version = (this._version || 0) + 1;
        this.setData({ busy: true, error: '' });
        const app = getApp();
        try {
            const results = await Promise.allSettled([resource(app.api, 'races', this.data.season), this.data.season === seed.season ? resource(app.api, 'next', this.data.season) : Promise.resolve(null), resource(app.api, 'seasons')]);
            if (version !== this._version)
                return;
            const calendar = results[0].status === 'fulfilled' ? results[0].value : null, next = results[1].status === 'fulfilled' ? results[1].value : null;
            if (!calendar && !next)
                throw Error('这个赛季的数据暂时无法读取，请重试。');
            const races = calendar && calendar.data.items || [], race = races.find(r => r.id === this._desiredRace) || (next && next.data) || races[0];
            if (!race) throw Error('这个赛季暂时没有比赛数据。');
            const source = calendar || next;
            const seasons = results[2].status === 'fulfilled' ? results[2].value.data.items : this.data.seasons;
            this.setData({ races, race, weatherIndex: Math.max(0, (race.schedule || []).findIndex(s => s.type === 'MainRace')), seasons, seasonIndex: Math.max(0,seasons.findIndex(s=>s.id===this.data.season)), stamp: (source.source === 'live' ? '在线数据' : '最近保存') + ' · ' + fmt.date(source.updatedAt) });
            this.renderRace();
            await this.loadWeather();
        }
        catch (error) {
            if (version === this._version)
                ui.fail(this, error);
        }
        finally {
            if (version === this._version && this._visible)
                this.setData({ busy: false });
        }
    },
    renderRace() { if (!this.data.race)
        return; const race = this.data.race, timezone = getApp().store.get().preferences.timezone; const sessions = fmt.sessions(race, timezone); this.setData({ sessions, track: seed.tracks[race.circuitId] || '', countdown: fmt.countdown(race) }); },
    async loadWeather() { const race = this.data.race; if (!race || !this._visible)
        return; const coords = seed.locations[race.circuit && race.circuit.nameKey]; if (!coords) {
        this._weatherRequest = (this._weatherRequest || 0) + 1; this.setData({ weather: null, weatherLoading: false, weatherError: '这条赛道的气象坐标尚未收录。' });
        return;
    } const id = race.id, request = this._weatherRequest = (this._weatherRequest || 0) + 1; if (this._weatherRace !== id)
        this.setData({ weather: null }); this.setData({ weatherLoading: true, weatherError: '' }); this._weatherRace = id; this._weatherAt = Date.now(); try {
        const value = await getApp().api.publicRead('/api/weather?' + query({ location: coords.join(',') }));
        if (this._visible && request === this._weatherRequest && this.data.race && this.data.race.id === id) {
            const selected = (race.schedule || [])[this.data.weatherIndex];
            this._forecast = value;
            this.setData({ weather: fmt.weatherView(value, race, selected && selected.id), weatherError: '' });
        }
    }
    catch (error) {
        if (this._visible && request === this._weatherRequest && this.data.race && this.data.race.id === id)
            this.setData({ weatherError: error.message || '天气暂时无法获取，请重试。' });
    } finally { if (this._visible && request === this._weatherRequest) this.setData({ weatherLoading: false }); } },
    changeSeason(e) { const index = Number(e.detail.value); this._desiredRace = ''; this._forecast = null; this.setData({ seasonIndex: index, season: this.data.seasons[index].id, calendar: false, weather: null, race: null, races: [], sessions: [], track: '' }); void this.refresh(); },
    showCalendar() { this.setData({ calendar: true }); }, showWeekend() { this.setData({ calendar: false }); },
    selectRace(e) { const race = this.data.races.find(r => r.id === e.currentTarget.dataset.id); if (!race)
        return; this._desiredRace = race.id; this._forecast = null; this.setData({ race, calendar: false, weather: null, weatherIndex: Math.max(0, (race.schedule || []).findIndex(s => s.type === 'MainRace')) }); this.renderRace(); void this.loadWeather(); wx.pageScrollTo({ scrollTop: 0, duration: 180 }); },
    changeWeather(e) { const index = Number(e.detail.value); this.setData({ weatherIndex: index }); if (this._forecast)
        this.setData({ weather: fmt.weatherView(this._forecast, this.data.race, (this.data.race.schedule || [])[index].id) }); },
    results(e) { const session = this.data.sessions.find(s => s.id === e.currentTarget.dataset.id); if (!session)
        return; const kind = /Practice/.test(session.type) ? 'practices' : /Qualifying/.test(session.type) ? 'qualifying' : 'races'; wx.navigateTo({ url: '/pages/results/index?' + query({ gp: this.data.race.id, session: session.id, kind, season: this.data.season, title: session.label, start: session.startDate }) }); },
    onShareAppMessage() { return { title: (this.data.race && this.data.race.name || '围场口袋') + ' · 比赛周末', path: '/pages/schedule/index?' + query({ race: this.data.race && this.data.race.id, season: this.data.season }) }; }
});
