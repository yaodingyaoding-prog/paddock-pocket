// Read-only smoke check against our existing production API. No credentials or account writes.
const { seed, query } = require('../miniprogram/lib/data'), config = require('../miniprogram/lib/config');
const locations = Object.values(seed.locations), paths = ['/api/data?' + query({ resource: 'seasons' }), ...['races', 'next', 'drivers', 'teams'].map(resource => '/api/data?' + query({ resource, season: seed.season })), '/api/news', '/api/weather?' + query({ location: locations[0].join(',') })];
(async () => { const rows = await Promise.all(paths.map(async (endpoint) => { const start = performance.now(); try {
    const response = await fetch(config.site + endpoint, { signal: AbortSignal.timeout(12000), headers: { Accept: 'application/json' } }), value = await response.json();
    const ok = response.ok && (endpoint === '/api/news' ? Array.isArray(value.items) : value.data != null);
    return { endpoint, status: response.status, ok, milliseconds: Math.round(performance.now() - start), source: value.source || '', updatedAt: value.updatedAt || value.checkedAt || value.fetchedAt || null };
}
catch (error) {
    return { endpoint, ok: false, milliseconds: Math.round(performance.now() - start), error: error.message };
} })); for (const row of rows)
    console.log(JSON.stringify(row)); console.log(JSON.stringify({ scope: 'Read-only Node HTTP smoke, not WeChat runtime or user-network performance', passed: rows.filter(r => r.ok).length, total: rows.length })); process.exitCode = rows.every(r => r.ok) ? 0 : 1; })();
