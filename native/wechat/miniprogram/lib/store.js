const palette = require('../data/palette');
const defaults = () => ({ driverIds: [], teamIds: [], theme: 'dark', accent: 'mint', timezone: 'Asia/Shanghai' });
function createStore(api) {
    const listeners = new Set();
    let state = { user: null, accountState: 'loading', preferences: defaults(), preferencesReady: false, saving: false, error: '' }, generation = 0, saveTail = Promise.resolve(), refreshTask, loggingOut = false;
    const emit = patch => { state = { ...state, ...patch }; listeners.forEach(fn => fn(state)); };
    async function preferences(owner, version) { const value = await api.request('/api/auth/preferences'); if (version === generation && state.user && state.user.id === owner)
        emit({ preferences: { ...defaults(), ...(value.record && value.record.preferences || {}) }, preferencesReady: true, error: '' }); }
    async function refresh() { if (refreshTask)
        return refreshTask; const version = generation; refreshTask = (async () => { try {
        const value = await api.request('/api/auth/session');
        if (version !== generation)
            return;
        if (!value.user) {
            emit({ user: null, accountState: 'guest', preferences: defaults(), preferencesReady: false, error: '' });
            return;
        }
        const changed = !state.user || state.user.id !== value.user.id;
        emit({ user: value.user, accountState: 'signed-in', ...(changed ? { preferences: defaults(), preferencesReady: false } : {}), error: '' });
        await preferences(value.user.id, version);
    }
    catch (error) {
        if (version === generation)
            emit({ accountState: state.user ? 'signed-in' : 'unavailable', error: error.message });
    } })(); try {
        await refreshTask;
    }
    finally {
        refreshTask = null;
    } }
    async function authenticate(action, input) { await saveTail; const version = ++generation; const result = await api.request('/api/auth/' + action, { method: 'POST', data: input }); if (version === generation && result.user) {
        emit({ user: result.user, accountState: 'signed-in', preferences: defaults(), preferencesReady: false, error: '' });
        try {
            await preferences(result.user.id, version);
        }
        catch (error) {
            if (version === generation)
                emit({ error: error.message });
        }
    } return result; }
    function save(patch) {
        if (loggingOut || !state.user || !state.preferencesReady)
            return Promise.reject(Error('请先登录并读取云端设置。'));
        const owner = state.user.id, version = generation;
        const task = saveTail.then(async () => { if (version !== generation || !state.user || state.user.id !== owner)
            throw Error('账号已切换，请重试。'); emit({ saving: true, error: '' }); try {
            const value = await api.request('/api/auth/preferences', { method: 'PATCH', data: { patch: typeof patch === 'function' ? patch(state.preferences) : patch } });
            if (!value.record || !value.record.preferences)
                throw Error('云端未确认保存，请重试。');
            if (version === generation && state.user && state.user.id === owner)
                emit({ preferences: { ...defaults(), ...value.record.preferences }, preferencesReady: true });
        }
        catch (error) {
            if (version === generation)
                emit({ error: error.message });
            throw error;
        }
        finally {
            if (version === generation)
                emit({ saving: false });
        } });
        saveTail = task.catch(() => { });
        return task;
    }
    function toggle(id, team = false) { return save(prefs => { const key = team ? 'teamIds' : 'driverIds', ids = prefs[key]; if (!team && !ids.includes(id) && ids.length >= 3)
        throw Error('领奖台最多三位，请先取消一位。'); return { [key]: ids.includes(id) ? ids.filter(v => v !== id) : [...ids, id] }; }); }
    async function logout() { if (loggingOut)
        return; loggingOut = true; try {
        await saveTail;
        await api.request('/api/auth/logout', { method: 'POST', data: {} });
        generation++;
        api.clearSession();
        emit({ user: null, accountState: 'guest', preferences: defaults(), preferencesReady: false, saving: false, error: '' });
    }
    finally {
        loggingOut = false;
    } }
    return { get: () => state, subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }, refresh, authenticate, save, toggle, logout, palette };
}
module.exports = { createStore, defaults };
