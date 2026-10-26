const ui = require('../../lib/page');
Page({ data: { skin: '' }, onShow() { ui.attach(this); }, onHide() { ui.detach(this); }, onUnload() { this.onHide(); } });
