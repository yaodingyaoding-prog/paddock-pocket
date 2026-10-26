const ui = require('../../lib/page');
Page({ data: { skin: '', mode: 'login', name: '', email: '', password: '', agreed: false, busy: false, error: '', message: '' }, onLoad(options) { if (['login', 'register', 'forgot'].includes(options.mode))
        this.setData({ mode: options.mode }); }, onShow() { ui.attach(this); }, onHide() { ui.detach(this); this.setData({ password: '' }); }, onUnload() { this.onHide(); }, input(e) { const key = e.currentTarget.dataset.field; if (['name', 'email', 'password'].includes(key))
        this.setData({ [key]: e.detail.value }); }, agree(e) { this.setData({ agreed: e.detail.value.includes('yes') }); }, mode(e) { if (this.data.busy)
        return; this.setData({ mode: e.currentTarget.dataset.mode, error: '', message: '', password: '' }); }, privacy() { wx.navigateTo({ url: '/pages/privacy/index' }); }, async submit() { if (this.data.busy)
        return; const mode = this.data.mode, email = this.data.email.trim(), name = this.data.name.trim(), password = this.data.password; this.setData({ error: '', message: '' }); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        this.setData({ error: '请填写有效的邮箱地址。' });
        return;
    } if (mode !== 'forgot' && password.length < 6) {
        this.setData({ error: '密码至少 6 个字符。' });
        return;
    } if (mode === 'register' && (!name || name.length > 30)) {
        this.setData({ error: '昵称请填写 1 至 30 个字符。' });
        return;
    } if (mode !== 'forgot' && !this.data.agreed) {
        this.setData({ error: '请先阅读并同意隐私说明。' });
        return;
    } this.setData({ busy: true }); try {
        if (mode === 'forgot') {
            const result = await getApp().api.request('/api/auth/forgot', { method: 'POST', data: { email } });
            this.setData({ message: result.message || '请查看邮箱，在邮件中打开安全链接完成密码重置。' });
            return;
        }
        const result = await getApp().store.authenticate(mode, mode === 'register' ? { name, email, password } : { email, password, remember: true });
        this.setData({ password: '' });
        if (result.user)
            wx.switchTab({ url: '/pages/profile/index' });
        else
            this.setData({ message: result.message || '账号已创建，请切换到登录。', mode: 'login' });
    }
    catch (error) {
        ui.fail(this, error);
    }
    finally {
        this.setData({ busy: false });
    } } });
