function copy(url) { if (typeof url !== 'string' || !/^https:\/\/[a-z0-9.-]+(?::443)?\//i.test(url) || /[\r\n]/.test(url)) {
    wx.showToast({ title: '入口暂不可用', icon: 'none' });
    return;
} wx.setClipboardData({ data: url, success() { wx.showToast({ title: '已复制，请在浏览器打开', icon: 'none' }); }, fail() { wx.showToast({ title: '未能复制，请重试', icon: 'none' }); } }); }
module.exports = { copy };
