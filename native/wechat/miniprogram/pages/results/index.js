const { resource, decode } = require('../../lib/data'), fmt = require('../../lib/format'), ui = require('../../lib/page');
Page({ data: { skin: '', rows: [], error: '', busy: false, title: '比赛成绩', pending: false }, onLoad(options) { this.options = Object.fromEntries(Object.entries(options).map(([key,value])=>[key,decode(value)])); this.setData({ title: this.options.title || '比赛成绩', pending: Date.parse(this.options.start) > Date.now() }); }, onShow() { ui.attach(this); void this.refresh(); }, onHide() { ui.detach(this); }, onUnload() { this.onHide(); }, async onPullDownRefresh() { await this.refresh(); ui.stopRefresh(); }, async refresh() { if (this.data.pending)
        return; this.setData({ busy: true, error: '' }); try {
        const o = this.options;
        if (!/^[a-f0-9-]{36}$/i.test(o.session || '') || !['practices', 'qualifying', 'races'].includes(o.kind))
            throw Error('比赛场次无效。');
        const value = await resource(getApp().api, 'results', o.season, { gp: o.gp, session: o.session, kind: o.kind });
        if (!this._visible)
            return;
        const rows = (value.data.participations || []).map(r => ({ name: r.driverName || r.driverTla, team: r.teamName, position: r.result && r.result.position || r.position || '—', result: fmt.result(r) })).sort((a, b) => (Number(a.position) || 999) - (Number(b.position) || 999));
        this.setData({ rows });
    }
    catch (error) {
        ui.fail(this, error);
    }
    finally {
        if (this._visible)
            this.setData({ busy: false });
    } } });
