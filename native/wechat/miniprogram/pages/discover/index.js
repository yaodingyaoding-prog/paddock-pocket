const { seed } = require('../../lib/data'), ui = require('../../lib/page'), fmt = require('../../lib/format'), links = require('../../lib/links');
Page({ data: { skin: '', items: seed.news, error: '', busy: false, stamp: '' }, onShow() { ui.attach(this); void this.refresh(); this._timer = setInterval(() => void this.refresh(), 300000); }, onHide() { ui.detach(this); clearInterval(this._timer); this._version = (this._version || 0) + 1; this.setData({ busy: false }); }, onUnload() { this.onHide(); }, async onPullDownRefresh() { await this.refresh(); ui.stopRefresh(); }, async refresh() { if (this.data.busy)
        return; const version = this._version = (this._version || 0) + 1; this.setData({ busy: true, error: '' }); try {
        const value = await getApp().api.request('/api/news');
        if (!this._visible || version !== this._version)
            return;
        if (!Array.isArray(value.items))
            throw Error('新闻暂不可用。');
        const items = [...new Map([...value.items, ...seed.news].map(item => [item.id, item])).values()].sort((a, b) => Date.parse(b.date) - Date.parse(a.date));
        getApp().news = items;
        this.setData({ items, stamp: '最近检查 · ' + fmt.date(value.checkedAt) });
    }
    catch (error) {
        if (version === this._version)
            ui.fail(this, error);
    }
    finally {
        if (this._visible && version === this._version)
            this.setData({ busy: false });
    } }, article(e) { wx.navigateTo({ url: '/pages/article/index?id=' + encodeURIComponent(e.currentTarget.dataset.id) }); }, replays() { wx.navigateTo({ url: '/pages/replays/index' }); }, watch(e) { links.copy(e.currentTarget.dataset.kind === 'smg' ? 'https://live.kankanews.com/huikan/' : 'https://v.qq.com/'); }, onShareAppMessage() { return { title: '围场口袋 · 新闻与赛事回放', path: '/pages/discover/index' }; } });
