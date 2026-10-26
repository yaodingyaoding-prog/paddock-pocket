function skin(state) { const palette = require('../data/palette'), theme = palette.themes.find(v => v.id === state.preferences.theme) || palette.themes[0], accent = palette.accents.find(v => v.id === state.preferences.accent) || palette.accents[0]; return '--bg:' + theme.bg + ';--panel:' + theme.panel + ';--text:' + theme.text + ';--muted:' + theme.muted + ';--accent:' + accent.color + ';'; }
function attach(page, callback) { const app = getApp(); page._visible = true; page._unsubscribe = app.store.subscribe(state => { if (page._visible) {
    page.setData({ skin: skin(state), account: state, preferences: state.preferences });
    if (callback)
        callback(state);
} }); const state = app.store.get(); page.setData({ skin: skin(state), account: state, preferences: state.preferences }); if (callback)
    callback(state); }
function detach(page) { page._visible = false; if (page._unsubscribe)
    page._unsubscribe(); }
function fail(page, error) { if (page._visible !== false)
    page.setData({ error: error.message || '暂时无法加载，请重试。' }); }
function stopRefresh() { wx.stopPullDownRefresh(); }
module.exports = { skin, attach, detach, fail, stopRefresh };
