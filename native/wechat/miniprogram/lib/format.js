const seed = require('../data/seed');
function date(value, timezone = 'Asia/Shanghai', timeOnly = false) { if (!value || !Number.isFinite(Date.parse(value)))
    return '时间待定'; try {
    return new Date(value).toLocaleString('zh-CN', { timeZone: timezone, month: timeOnly ? undefined : '2-digit', day: timeOnly ? undefined : '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
}
catch {
    return new Date(value).toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
} }
function standing(data) { return data && data.items && data.items[0] && data.items[0].standings || []; }
function portrait(row) { const direct = seed.portraits[row.driverId], history = seed.history || {}; let key = (history.ids || {})[row.driverId]; if(!key) for(const name of [row.driverName,row.name,row.driverNameKey]) { if(name) key=(history.names||{})[String(name).normalize('NFKD').replace(/[\p{M}\p{P}\p{Z}\s]/gu,'').toLowerCase()]; if(key) break; } return direct || (key && (history.images || {})[key] ? 'https://f1.xiaodinglab.com' + history.images[key] : '/assets/nav/profile-on.png'); }
function drivers(data) { return standing(data).map(row => ({ ...row, avatar: portrait(row), headshot: (seed.headshots || {})[row.driverId] || portrait(row), points: row.points == null ? '—' : row.points, number: row.number || '—' })); }
function sessions(race, timezone) { return (race.schedule || []).map(s => ({ ...s, label: ({ FirstPractice: '一练', SecondPractice: '二练', ThirdPractice: '三练', StandardQualifying: '排位赛', SprintQualifying: '冲刺排位', SprintRace: '冲刺赛', MainRace: '正赛' })[s.type] || s.sessionName || '场次', time: date(s.startDate, timezone), finished: Date.parse(s.endDate || s.startDate) < Date.now() })); }
function countdown(race, now = Date.now()) { const upcoming = (race.schedule || []).filter(s => Date.parse(s.startDate) > now).sort((a, b) => Date.parse(a.startDate) - Date.parse(b.startDate))[0]; if (!upcoming)
    return '比赛周末已结束'; const minutes = Math.max(0, Math.floor((Date.parse(upcoming.startDate) - now) / 60000)); return Math.floor(minutes / 1440) + '天 ' + Math.floor(minutes % 1440 / 60) + '小时 ' + minutes % 60 + '分钟'; }
function weatherName(code) { if (code === 0)
    return '晴'; if (code <= 3)
    return '多云'; if (code <= 48)
    return '雾'; if (code <= 67)
    return '降雨'; if (code <= 77)
    return '降雪'; if (code <= 86)
    return '阵雨／阵雪'; return '雷雨'; }
function weatherView(entry, race, sessionId, now = Date.now()) {
    const data = entry.data, current = data.current, hourly = data.hourly || {}, selected = (race.schedule || []).find(s => s.id === sessionId) || (race.schedule || []).find(s => s.type === 'MainRace');
    let index = -1;
    if (selected)
        index = (hourly.time || []).findIndex(t => t <= Date.parse(selected.startDate) / 1000 && Date.parse(selected.startDate) / 1000 < t + 3600);
    const finished = selected && Date.parse(selected.endDate || selected.startDate) < now;
    return { temperature: Math.round(current.temperature_2m), condition: weatherName(current.weather_code), wind: current.wind_speed_10m, timezone: data.timezone || '赛道当地', fetched: date(new Date(entry.fetchedAt).toISOString(), data.timezone || 'UTC'), stale: !!entry.stale || entry.source === 'cache', forecast: finished ? '该场次已结束' : index < 0 ? '尚未进入预报范围' : Math.round(hourly.temperature_2m[index]) + '° · 降水 ' + hourly.precipitation_probability[index] + '%', forecastLabel: selected ? selected.sessionName : '正赛' };
}
function result(row) { const r = row.result; if (row.q3 || row.q2 || row.q1)
    return row.q3 || row.q2 || row.q1; if (!r)
    return row.time || row.fastestLap && row.fastestLap.time || '—'; if (r.resultStatus === 'Dnf')
    return 'DNF'; if (r.resultStatus === 'Dns')
    return '未发车'; if (['Dsq', 'Dsqd', 'Disqualified'].includes(r.resultStatus))
    return '取消资格'; if (r.lapsBehindLeader > 0)
    return '落后 ' + r.lapsBehindLeader + ' 圈'; if (r.position > 1 && r.gapToLeader && r.gapToLeader !== '0')
    return String(r.gapToLeader).startsWith('+') ? r.gapToLeader : '+' + r.gapToLeader; return r.time || row.fastestLap && row.fastestLap.time || '—'; }
function teamKey(row) { const aliases = seed.teamAliases || {}, name = String(row.teamShortName || row.teamName || '').toLowerCase(); return ['racingbulls', ...Object.keys(aliases).filter(k => k !== 'racingbulls')].find(k => (aliases[k] || []).some(a => name.includes(a))) || row.teamId || ''; }
module.exports = { date, standing, drivers, portrait, sessions, countdown, weatherView, result, teamKey };
