const { seed, resource } = require('../../lib/data'), fmt = require('../../lib/format'), ui = require('../../lib/page');
Page({ data: { skin: '', error: '', busy: false, expanded: false, kind: 'drivers', season: seed.season, seasonIndex: 0, seasons: seed.seasons.items, rows: [], stamp: '' }, onShow() { ui.attach(this, () => this.renderRows()); void this.refresh(); }, onHide() { ui.detach(this); this._version = (this._version || 0) + 1; }, onUnload() { this.onHide(); }, async onPullDownRefresh() { await this.refresh(); ui.stopRefresh(); },
    async refresh() { const version = this._version = (this._version || 0) + 1; this.setData({ busy: true, error: '' }); try {
        const value = await resource(getApp().api, this.data.kind, this.data.season);
        if (version !== this._version)
            return;
        this._rows = this.data.kind === 'drivers' ? fmt.drivers(value.data) : fmt.standing(value.data);
        this.setData({ stamp: (value.source === 'live' ? '在线数据' : '最近保存') + ' · ' + fmt.date(value.updatedAt) });
        this.renderRows();
    }
    catch (error) {
        if (version === this._version)
            ui.fail(this, error);
    }
    finally {
        if (version === this._version && this._visible)
            this.setData({ busy: false });
    } },
    renderRows() { const state = getApp().store.get(), team = this.data.kind === 'teams'; const rows = (this._rows || []).map(r => ({ ...r, key: team ? r.teamId : r.driverId, name: team ? r.teamName : r.driverName, team: r.teamName || r.teamShortName, avatar: r.headshot || r.avatar || '/assets/nav/profile-on.png', car: this.data.season === seed.season && seed.teamAliases[fmt.teamKey(r)] ? '/assets/cars/' + fmt.teamKey(r) + '.webp' : '', followed: (team ? state.preferences.teamIds : state.preferences.driverIds).includes(team ? fmt.teamKey(r) : r.driverId) })); this.setData({ rows: this.data.expanded ? rows : rows.slice(0, 5), total: rows.length }); },
    switchKind(e) { this._rows = []; this.setData({ kind: e.currentTarget.dataset.kind, expanded: false, rows: [], stamp: '' }); void this.refresh(); }, expand() { this.setData({ expanded: !this.data.expanded }); this.renderRows(); }, changeSeason(e) { const i = Number(e.detail.value); this._rows = []; this.setData({ seasonIndex: i, season: this.data.seasons[i].id, rows: [], expanded: false, stamp: '' }); void this.refresh(); },
    detail(e) { const row = this.data.rows[e.currentTarget.dataset.index]; if (this.data.kind === 'teams') {
        wx.showModal({ title: row.name, content: '赛季排名 P' + row.position + '\n积分 ' + row.points, showCancel: false });
        return;
    } wx.navigateTo({ url: '/pages/driver/index?id=' + row.driverId + '&season=' + encodeURIComponent(this.data.season) }); },
    async follow(e) { const row = this.data.rows[e.currentTarget.dataset.index]; try {
        await getApp().store.toggle(this.data.kind === 'teams' ? fmt.teamKey(row) : row.driverId, this.data.kind === 'teams');
    }
    catch (error) {
        ui.fail(this, error);
    } },
    avatarError(e) { this.setData({ ['rows[' + Number(e.currentTarget.dataset.index) + '].avatar']: '/assets/nav/profile-on.png' }); }, onShareAppMessage() { return { title: '围场口袋 · 车手与车队积分', path: '/pages/rankings/index' }; }
});
