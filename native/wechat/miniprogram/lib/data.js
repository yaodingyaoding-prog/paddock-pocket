const seed = require('../data/seed');
const query = values => Object.keys(values).filter(k => values[k] !== undefined && values[k] !== null).map(k => encodeURIComponent(k) + '=' + encodeURIComponent(String(values[k]))).join('&');
function decode(value) { try { return decodeURIComponent(value || ''); } catch { return value || ''; } }
function resource(api, name, season = seed.season, extra = {}) { const fallback = (season === seed.season || name === 'seasons') && seed[name] ? { data: seed[name], source: 'snapshot', updatedAt: seed.updatedAt } : undefined; return api.publicRead('/api/data?' + query({ resource: name, season, ...extra }), fallback); }
module.exports = { seed, query, resource, decode };
