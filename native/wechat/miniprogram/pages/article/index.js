const { seed, decode } = require('../../lib/data'), ui = require('../../lib/page'), links = require('../../lib/links');
Page({ data: { skin: '', item: null, paragraphs: [], error: '' }, onLoad(options) { this.id = decode(options.id); }, onShow() { ui.attach(this); void this.load(); }, onHide() { ui.detach(this); }, onUnload() { this.onHide(); }, async load() { try {
        let item = (getApp().news || seed.news).find(v => v.id === this.id);
        if (!item) {
            const value = await getApp().api.request('/api/news');
            item = (value.items || []).find(v => v.id === this.id);
        }
        if (!item)
            throw Error('这条新闻暂时无法读取。');
        if (this._visible)
            this.setData({ item, paragraphs: seed.briefs[item.id] || [], error: '' });
    }
    catch (error) {
        ui.fail(this, error);
    } }, source() { if (this.data.item)
        links.copy(this.data.item.url); }, onShareAppMessage() { return { title: this.data.item ? this.data.item.title : '围场新闻', path: '/pages/article/index?id=' + encodeURIComponent(this.id) }; } });
