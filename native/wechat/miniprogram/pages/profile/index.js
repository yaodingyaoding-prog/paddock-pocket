const { seed, resource } = require('../../lib/data'), fmt = require('../../lib/format'), ui = require('../../lib/page'), timezones = require('../../data/timezones'), palette = require('../../data/palette'), links = require('../../lib/links'), { createAvatarFiles } = require('../../lib/avatar');
Page({ data: { skin: '', error: '', avatar: '', member: '', podium: [], teams: [], themes: palette.themes, accents: palette.accents, zones: timezones, zoneIndex: 0, zoneSearch: '', loggingOut: false }, onShow() { this._avatars = this._avatars || createAvatarFiles(wx); ui.attach(this, state => this.render(state)); void this.loadDrivers(); }, onHide() { ui.detach(this); }, onUnload() { this.onHide(); if (this._avatars)
        this._avatars.clear(); }, async onPullDownRefresh() { this._avatarKey = ''; await Promise.allSettled([getApp().store.refresh(), this.loadDrivers()]); this.render(getApp().store.get()); ui.stopRefresh(); }, async loadDrivers() { try {
        const value = await resource(getApp().api, 'drivers');
        this._drivers = fmt.drivers(value.data);
        this.render(getApp().store.get());
    }
    catch (error) {
        ui.fail(this, error);
    } }, render(state) { const owner = state.user && state.user.id; if (this._owner !== owner) {
        this._owner = owner;
        this._avatarKey = '';
        this._avatars.clear();
        this.setData({ avatar: '' });
    } const chosen = state.preferences.driverIds.map(id => (this._drivers || fmt.drivers(seed.drivers)).find(row => row.driverId === id) || { driverId: id, driverName: '已关注车手', avatar: fmt.portrait({ driverId: id }) }); const podium = [chosen[1], chosen[0], chosen[2]].map((row, i) => ({ slot: [2, 1, 3][i], className: ['second', 'first', 'third'][i], ...(row || { driverName: '等待入席', avatar: '/assets/nav/profile.png' }) })); this.setData({ member: owner ? 'FAN / ' + owner.replace(/-/g, '').slice(0, 10).toUpperCase() : '', podium, teams: state.preferences.teamIds.map(id => ({ id, name: (fmt.standing(seed.teams).find(r => fmt.teamKey(r) === id) || {}).teamName || id })), zoneIndex: Math.max(0, this.data.zones.indexOf(state.preferences.timezone)) }); const key = owner + '|' + (state.user && state.user.avatarUrl || ''); if (owner && state.user.avatarUrl && this._avatarKey !== key) {
        this._avatarKey = key;
        void this._avatars.load(getApp().api).then(file => { if (this._visible && this._owner === owner && file)
            this.setData({ avatar: file }); }).catch(() => { if (this._owner === owner) {
            this._avatarKey = '';
            if (this._visible)
                this.setData({ avatar: '' });
        } });
    } }, login() { wx.navigateTo({ url: '/pages/auth/index' }); }, async retry() { await getApp().store.refresh(); }, rankings() { wx.switchTab({ url: '/pages/rankings/index' }); }, driver(e) { const id = e.currentTarget.dataset.id; if (id)
        wx.navigateTo({ url: '/pages/driver/index?id=' + id }); }, async setting(e) { try {
        await getApp().store.save({ [e.currentTarget.dataset.field]: e.currentTarget.dataset.id });
    }
    catch (error) {
        ui.fail(this, error);
    } }, searchZone(e) { const term = e.detail.value.toLowerCase(), zones = timezones.filter(z => z.toLowerCase().includes(term)); this.setData({ zoneSearch: e.detail.value, zones, zoneIndex: Math.max(0, zones.indexOf(getApp().store.get().preferences.timezone)) }); }, async timezone(e) { const value = this.data.zones[Number(e.detail.value)]; if (!value)
        return; try {
        await getApp().store.save({ timezone: value });
    }
    catch (error) {
        ui.fail(this, error);
    } }, async removeTeam(e) { try {
        await getApp().store.toggle(e.currentTarget.dataset.id, true);
    }
    catch (error) {
        ui.fail(this, error);
    } }, async logout() { if (this.data.loggingOut)
        return; this.setData({ loggingOut: true, error: '' }); try {
        await getApp().store.logout();
        this._avatars.clear();
        this.setData({ avatar: '' });
    }
    catch (error) {
        ui.fail(this, error);
    }
    finally {
        this.setData({ loggingOut: false });
    } }, avatarError() { this.setData({ avatar: '' }); }, privacy() { wx.navigateTo({ url: '/pages/privacy/index' }); }, github() { links.copy('https://github.com/yaodingyaoding-prog/paddock-pocket'); } });
