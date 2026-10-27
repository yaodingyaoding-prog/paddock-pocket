const { seed, resource } = require('../../lib/data'), fmt = require('../../lib/format'), ui = require('../../lib/page');
Page({ data: { skin: '', error: '', driver: {}, archive: null, stats: [], followed: false }, onLoad(options) { this.id = options.id; this.season = options.season || seed.season; }, onShow() { ui.attach(this, state => this.setData({ followed: state.preferences.driverIds.includes(this.id) })); void this.refresh(); }, onHide() { ui.detach(this); }, onUnload() { this.onHide(); }, async onPullDownRefresh() { await this.refresh(); ui.stopRefresh(); }, async refresh() { try {
        if (!/^[a-f0-9-]{36}$/i.test(this.id || ''))
            throw Error('车手编号无效。');
        const [archive, standings] = await Promise.allSettled([getApp().api.request('/api/drivers/' + this.id), resource(getApp().api, 'drivers', this.season)]);
        if (!this._visible)
            return;
        const row = standings.status === 'fulfilled' ? fmt.drivers(standings.value.data).find(d => d.driverId === this.id) : null;
        if (archive.status === 'rejected' && !row)
            throw archive.reason;
        const data = archive.status === 'fulfilled' ? archive.value.data : null;
        this.setData({ driver: row ? { ...row, avatar: row.headshot } : { driverName: data.name, avatar: fmt.portrait({ driverId: this.id }) }, archive: data ? { ...data, history: data.history.map((row, index) => ({ ...row, key: String(index) })) } : null, stats: data ? [['出赛', data.career.starts], ['分站冠军', data.career.wins], ['领奖台', data.career.podiums], ['杆位', data.career.poles], ['世界冠军', data.career.titles]].map(([label, value]) => ({ label, value: value == null ? '—' : value })) : [], error: archive.status === 'rejected' ? '生涯资料暂时无法读取。' : '' });
    }
    catch (error) {
        ui.fail(this, error);
    } }, async follow() { try {
        await getApp().store.toggle(this.id);
    }
    catch (error) {
        ui.fail(this, error);
    } }, avatarError() { this.setData({ 'driver.avatar': '/assets/nav/profile-on.png' }); }, onShareAppMessage() { return { title: this.data.driver.driverName + ' · 车手档案', path: '/pages/driver/index?id=' + this.id + '&season=' + this.season }; } });
