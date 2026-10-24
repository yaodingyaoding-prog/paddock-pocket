# iPad Safari + Userscripts 安装

本目录包含适配 Userscripts 的 0.26.0 版本。需要同时启用两个文件：

| 文件 | Userscripts 中显示的名称 |
| --- | --- |
| `smg_fivestar.ipad.user.js` | 收看SMGTV电视节目（iPad Userscripts） |
| `smg_fivestar.ipad-helper.user.js` | SMG iPad 请求助手 |

## 安装步骤

1. 将两个 `.user.js` 文件传到 iPad，在「文件」App 中保存到 Userscripts App 已设置的脚本目录。请确认后缀仍是 `.user.js`，没有变成 `.txt`。
2. 在 iPad 设置中找到 Safari → 扩展 → Userscripts，启用扩展；允许它访问 `kankanews.com`。不同 iPadOS 版本下 Safari 设置可能位于「设置 → App → Safari」。
3. 打开 Safari，访问 `https://live.kankanews.com/huikan?id=10`。
4. 点击 Safari 的扩展按钮，打开 Userscripts，确认以上两个脚本都已列出并开启。关闭之前导入的普通版「收看SMGTV电视节目」，避免重复运行。
5. 安装或替换文件后，要先打开一次 Userscripts 扩展弹窗，再刷新直播页。Userscripts 需要这一步重新读取文件。
6. 页面左下角应出现「SMG」状态按钮。如果显示「点按播放」，点一次按钮，或点击播放器中的播放按钮。

## 状态含义

- 没有 SMG 按钮：页面脚本未加载。检查脚本目录、扩展和网站访问许可、两个脚本的开关；也可能是站点 CSP 阻止页面环境脚本，需进一步查看报错。
- 「已加载，等待播放器」：脚本已运行，但尚未找到视频元素。
- 「正在加载」：已经找到视频，正在加载数据。
- 「点按播放」：视频暂停，点按按钮尝试开始播放。
- 「媒体错误」或 `NotSupportedError`：视频源未成功播放，记录状态文字并提供截图以继续排查。
- 「正在播放」：视频未暂停且已有可播放数据。仍需看画面是否持续推进、实际节目是否正确；这个状态不能单独证明 F1 直播可用。

## 技术说明与验证范围

0.26.0 修复共享取源逻辑：直播优先刷新当前节目详情的直播地址；签名参数按当前站点版本与平台生成；已过期地址不再当成成功结果；频道旧地址不再覆盖节目详情的新地址。媒体错误即使伴随原生暂停，也能进入恢复流程。

Userscripts 不提供油猴式的 `unsafeWindow`；使用 GM API 时脚本处于隔离环境，无法直接修改网页的 Vue 实例、播放器及请求函数。因此主脚本明确运行于 `page` 环境，请求助手运行于 `content` 环境。主脚本优先使用网页请求，失败后通过 DOM 事件向助手发起限定的节目接口 GET 请求。助手只允许两个节目接口，不接收任意目标 URL、方法或敏感请求头。

两个脚本的名称不同，均由 `npm run build:ipad` 从公共播放脚本及 `scripts/ipad-runtime.cjs` 生成。没有添加上游自动更新链接，避免被不适用于 Userscripts 的普通版替换。

已在本地测试独立 JavaScript 环境间的通信、没有 `unsafeWindow` 的启动、网页请求钩子、助手加载顺序、重复请求、超时、失败和手动点按播放。还在 Chromium 访问真实手机站，确认主脚本与助手刷新直播地址后有视频数据、时间推进。该测试不等同于真实 iPad Safari；设备端的扩展许可、CSP、网络和媒体支持仍需实际验证。

参考：[Userscripts 官方环境与 API 说明](https://github.com/quoid/userscripts/tree/release/4.x.x#metadata)、[unsafeWindow 支持讨论](https://github.com/quoid/userscripts/issues/265)。
