# SMG 三端脚本 0.26.0

更新：2026-10-24。来源：维护者提供的 `SMG-All-Platforms-0.26.0` 发布包。上游项目为 [Popukok/smg_live](https://github.com/Popukok/smg_live)，版权 `Copyright (c) 2025 _xFox`，采用 MIT 许可。

网站发布电脑、Android 以及 iPhone / iPad 两份配套脚本，保留收到文件的原始字节、作者、元数据及许可。完整三端包保留原安装说明、SHA256SUMS、测试记录和 LIVE-CHECK。包内说明与测试记录属于来源材料，不代表本站另行完成所有设备的播放测试。

## 文件与 SHA-256

| 文件 | SHA-256 |
| --- | --- |
| smg_fivestar.user.js | d2b93f0c4ca7a593ef60f2c6b8f68da6092ec60aed18139efc6e38243ebc6987 |
| smg_fivestar.android.user.js | a9d456ab2dddd3ed2dbec4f936745dbf0e3df35486c36bbd151513b5e692cb6c |
| smg_fivestar.ipad.user.js | 56b23434f5116b4d6b55a570e43bbbaef234793c77b2c05c3339a570e72a3eab |
| smg_fivestar.ipad-helper.user.js | 90539b52ddc48d7d4dc2a2ece15e223a27f1b14f94b614823e9d59b8473237a6 |

全部下载文件的长度与哈希见 [release.json](release.json)。完整包为 [SMG-All-Platforms-0.26.0.zip](SMG-All-Platforms-0.26.0.zip)，Android 单独包为 [SMG-Android-0.26.0.zip](SMG-Android-0.26.0.zip)。原作者许可见 [LICENSE](LICENSE)，APK 内副本也附带相同许可。

## 安装与更新

- 电脑：导入 `smg_fivestar.user.js`，覆盖旧版；元数据保留上游更新地址，使用本地适配版时请核对脚本管理器的自动更新设置。
- Android 浏览器：只启用 `smg_fivestar.android.user.js`；ZIP 是脚本分发包，解压后导入脚本管理器。
- iPhone / iPad：同时启用主脚本与请求助手。替换后先打开 Userscripts 扩展弹窗，再刷新直播页面。
- 每台设备停用旧副本和其他平台版本；关闭旧直播标签页，再重新打开官方直播页。
- 围场口袋 Android 0.7.1 随包内置 0.26.0 安卓原文件，在独立官方页面窗口加载。原生窗口仅允许 HTTPS 的看看新闻直播页面，不增加凭据桥或关闭同源策略。旧安装包需覆盖升级才能更新内置脚本。

脚本包含播放器及节目限制字段处理、播放源获取与恢复逻辑，作用不限于样式。实际节目由平台提供。iOS 配套助手仅处理原脚本限定的节目接口请求，不在围场口袋站点执行。
