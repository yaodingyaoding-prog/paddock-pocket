const { seed, resource } = require('../../lib/data'), ui = require('../../lib/page'), links = require('../../lib/links');
const types = [{ label: '正赛', query: '正赛', types: ['MainRace'] }, { label: '排位赛', query: '排位赛', types: ['StandardQualifying'] }, { label: '冲刺赛', query: '冲刺赛', types: ['SprintRace'] }, { label: '练习赛', query: '自由练习赛', types: ['FirstPractice', 'SecondPractice', 'ThirdPractice'] }];
Page({ data: { skin: '', error: '', busy: false, seasons: seed.seasons.items, seasonIndex: 0, season: seed.season, types, type: 0, search: '', races: [] }, onShow() { ui.attach(this); void this.refresh(); }, onHide() { ui.detach(this); this._version = (this._version || 0) + 1; }, onUnload() { this.onHide(); }, async onPullDownRefresh() { await this.refresh(); ui.stopRefresh(); }, async refresh() { const version = this._version = (this._version || 0) + 1; this.setData({ busy: true, error: '' }); try {
        const value = await resource(getApp().api, 'races', this.data.season);
        if (version !== this._version)
            return;
        this._races = value.data.items || [];
        this.filter();
    }
    catch (error) {
        if (version === this._version)
            ui.fail(this, error);
    }
    finally {
        if (version === this._version && this._visible)
            this.setData({ busy: false });
    } }, filter() { const term = this.data.search.trim().toLowerCase(), kind = types[this.data.type]; this.setData({ races: (this._races || []).filter(r => (!r.schedule.length || r.schedule.some(s => kind.types.includes(s.type))) && (!term || [r.name, r.nameKey, r.circuit.name, r.circuit.place, r.round].join(' ').toLowerCase().includes(term))) }); }, search(e) { this.setData({ search: e.detail.value }); this.filter(); }, changeType(e) { this.setData({ type: Number(e.detail.value) }); this.filter(); }, changeSeason(e) { const i = Number(e.detail.value); this._races = []; this.setData({ seasonIndex: i, season: this.data.seasons[i].id, races: [] }); void this.refresh(); }, copy(e) { const race = this.data.races.find(r => r.id === e.currentTarget.dataset.id); if (!race)
        return; const year = this.data.seasons.find(s => s.id === this.data.season).year, q = encodeURIComponent('F1 ' + year + ' ' + race.name + ' ' + types[this.data.type].query + ' 全场回放'); links.copy(e.currentTarget.dataset.platform === 'bilibili' ? 'https://search.bilibili.com/all?keyword=' + q : 'https://v.qq.com/x/search/?q=' + q); }, onShareAppMessage() { return { title: '围场口袋 · 赛事回放', path: '/pages/replays/index' }; } });
