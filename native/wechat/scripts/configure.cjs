const fs = require('node:fs'), path = require('node:path');
const appid = process.argv[2];
if (!/^wx[a-f0-9]{16}$/.test(appid || ''))
    throw Error('用法：npm run configure -- wx开头的真实AppID（不需要AppSecret）');
fs.writeFileSync(path.join(__dirname, '../project.private.config.json'), JSON.stringify({ appid }, null, 2) + '\n');
console.log('AppID已写入本地私有配置。');
