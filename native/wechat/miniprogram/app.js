const { createApi } = require('./lib/api');
const { createStore } = require('./lib/store');
App({ onLaunch() { this.api = createApi(wx); this.store = createStore(this.api); }, onShow() { void this.store.refresh(); }, globalData: {} });
