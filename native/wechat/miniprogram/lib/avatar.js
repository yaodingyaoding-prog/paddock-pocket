// Authenticated images stay in the app's private sandbox, never in public cache.
function createAvatarFiles(platform) { let current = '', version = 0; const fs = platform.getFileSystemManager(); function remove(file) { if (file)
    try {
        fs.unlinkSync(file);
    }
    catch { } } try {
    if (fs.readdirSync)
        for (const name of fs.readdirSync(platform.env.USER_DATA_PATH))
            if (/^paddock-avatar-\d+-\d+\.webp$/.test(name))
                remove(platform.env.USER_DATA_PATH + '/' + name);
}
catch { } function clear() { version++; remove(current); current = ''; } async function load(api) { const ownVersion = ++version, data = await api.request('/api/auth/avatar', { binary: true }); if (ownVersion !== version)
    return ''; const file = platform.env.USER_DATA_PATH + '/paddock-avatar-' + ownVersion + '-' + Date.now() + '.webp'; return new Promise((resolve, reject) => fs.writeFile({ filePath: file, data, success() { if (ownVersion !== version) {
        remove(file);
        resolve('');
        return;
    } remove(current); current = file; resolve(file); }, fail() { reject(Error('头像暂时无法显示。')); } })); } return { load, clear }; }
module.exports = { createAvatarFiles };
