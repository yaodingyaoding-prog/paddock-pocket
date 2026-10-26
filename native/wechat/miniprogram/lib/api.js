const config = require('./config');
const transient = new Set([408, 425, 500, 502, 503, 504]);
function createApi(platform, now = Date.now) {
    let jar = {}, authTail = Promise.resolve(), cache = {};
    try {
        const value = platform.getStorageSync(config.sessionKey);
        if (value && typeof value === 'object')
            jar = value;
    }
    catch { }
    try {
        const value = platform.getStorageSync(config.cacheKey);
        if (value && typeof value === 'object')
            cache = value;
    }
    catch { }
    const cookieName = name => /^(?:sb-[a-zA-Z0-9_.-]+|paddock-(?:remember|recovery))$/.test(name);
    function persist() { platform.setStorageSync(config.sessionKey, jar); }
    function cookies() { return Object.keys(jar).filter(name => cookieName(name) && jar[name] && typeof jar[name].value === 'string' && !/[\r\n;]/.test(jar[name].value) && (!jar[name].expires || jar[name].expires > now())).map(name => name + '=' + jar[name].value).join('; '); }
    function receive(response) {
        const headers = response.header || {}, raw = response.cookies && response.cookies.length ? response.cookies : Object.keys(headers).filter(k => k.toLowerCase() === 'set-cookie').flatMap(k => Array.isArray(headers[k]) ? headers[k] : String(headers[k]).split(/,(?=\s*(?:sb-|paddock-)[^=;,\s]+=)/));
        if (!raw.length)
            return;
        for (const line of raw) {
            const parts = String(line).split(';'), first = parts.shift(), at = first.indexOf('=');
            if (at < 1)
                continue;
            const name = first.slice(0, at).trim(), value = first.slice(at + 1);
            if (!cookieName(name) || /[\r\n]/.test(value))
                continue;
            const attrs = {};
            for (const part of parts) {
                const eq = part.indexOf('=');
                attrs[(eq < 0 ? part : part.slice(0, eq)).trim().toLowerCase()] = eq < 0 ? '' : part.slice(eq + 1).trim();
            }
            if (attrs.domain && attrs.domain.replace(/^\./, '').toLowerCase() !== 'f1.xiaodinglab.com')
                continue;
            const age = attrs['max-age'] === undefined ? null : Number(attrs['max-age']);
            let expires = attrs.expires ? Date.parse(attrs.expires) : 0;
            if (age !== null && Number.isFinite(age))
                expires = now() + age * 1000;
            if (!value || expires && expires <= now())
                delete jar[name];
            else
                jar[name] = { value, expires: Number.isFinite(expires) ? expires : 0 };
        }
        persist();
    }
    function send(path, options = {}) {
        if (!/^\/api\/(?:data(?:\?|$)|weather\?|news$|drivers\/[a-f0-9-]{36}$|auth\/(?:session|login|register|forgot|logout|preferences|avatar)$)/i.test(path) || path.includes('\\') || /[\r\n]/.test(path))
            return Promise.reject(Error('请求地址无效。'));
        const privateRead = path.startsWith('/api/auth/'), method = options.method || 'GET', header = { 'Content-Type': 'application/json' };
        if (privateRead) {
            const cookie = cookies();
            if (cookie)
                header.Cookie = cookie;
            if (method !== 'GET')
                header.Origin = config.site;
        }
        return new Promise((resolve, reject) => platform.request({ url: config.site + path, method, data: options.data, header, timeout: 10000, dataType: options.binary ? 'text' : 'json', responseType: options.binary ? 'arraybuffer' : 'text',
            success(response) { try {
                if (privateRead)
                    receive(response);
                const value = response.data;
                if (response.statusCode < 200 || response.statusCode >= 300) {
                    const error = Error(value && typeof value === 'object' && value.error || '服务暂不可用，请稍后重试。');
                    error.status = response.statusCode;
                    reject(error);
                    return;
                }
                if (!options.binary && (!value || typeof value !== 'object' || Array.isArray(value))) {
                    reject(Error('服务返回了无法识别的内容。'));
                    return;
                }
                resolve(value);
            }
            catch (error) {
                reject(error);
            } },
            fail() { const error = Error('连接暂时中断，请检查网络后重试。'); error.network = true; reject(error); }
        }));
    }
    function request(path, options = {}) {
        if (!path.startsWith('/api/auth/'))
            return send(path, options);
        const task = authTail.then(() => send(path, options));
        authTail = task.catch(() => { });
        return task;
    }
    async function publicRead(path, fallback) {
        if (path.startsWith('/api/auth/'))
            throw Error('账号数据不能进入公共缓存。');
        for (let attempt = 0; attempt < 2; attempt++)
            try {
                const value = await request(path);
                if (value.data == null)
                    throw Error('赛事数据暂不可用。');
                cache[path] = value;
                const keys = Object.keys(cache);
                if (keys.length > 20)
                    delete cache[keys[0]];
                try {
                    platform.setStorageSync(config.cacheKey, cache);
                }
                catch { }
                return value;
            }
            catch (error) {
                if (!attempt && (error.network || transient.has(error.status)))
                    continue;
                if (cache[path] && cache[path].data != null)
                    return { ...cache[path], source: 'cache' };
                if (fallback)
                    return { ...fallback, source: 'snapshot' };
                throw error;
            }
    }
    return { request, publicRead, clearSession() { jar = {}; platform.removeStorageSync(config.sessionKey); }, cookieHeader: cookies };
}
module.exports = { createApi };
