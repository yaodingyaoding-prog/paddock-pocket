# 围场口袋 · Paddock Pocket

[简体中文](README.md) · [English](README.en.md)

**为 F1 车迷打造的赛事信息与观赛平台。**

围场口袋围绕比赛周末组织信息，将赛程、积分、赛道天气、数据分析与观赛入口连接为完整的使用流程。项目持续开发自己的产品界面、业务逻辑、设备适配和部署体系，支持手机、平板与桌面浏览器。

本仓库维护网页版源码、服务端接口、公开资源与 Cloudflare Workers 部署配置。

**在线访问：[F1.xiaodinglab.com](https://F1.xiaodinglab.com/)** · **[赛事回放](https://F1.xiaodinglab.com/#discover/replays)**

![围场口袋赛事回放界面](docs/images/race-replays.jpg)

## 我们的工作

围场口袋的建设覆盖产品、交互、工程与交付，而不止于整理赛事链接：

- **产品与界面**：重新组织赛程、积分、观赛和探索模块，设计二级页面、响应式布局、多套主题及设备偏好设置。
- **赛事体验**：整合比赛日程、成绩、车手档案与数据工具，补充历史车手头像、立体赛道展示和争冠积分情景分析。
- **天气与观赛**：按赛道位置和比赛时间展示天气，依据赛程调整更新频率；建立可按赛季、分站与场次检索的回放中心，并提供不同设备的直播使用引导。
- **数据与性能**：实现同源数据接口、参数校验、缓存、带时间标记的快照回退、精简头像索引、本地字体及启动异常提示。
- **部署与维护**：完成独立域名和 Cloudflare Workers 部署，维护自动检查、生产构建及资源来源记录。

## 功能概览

| 模块 | 功能 |
| --- | --- |
| 赛程与成绩 | 切换赛季，查看分站及比赛周末安排、发车倒计时、场次成绩与日历提醒 |
| 积分榜与车手档案 | 车手与车队积分、赛季车号、生涯成就、冠军年份、历年车队、部分已核实绰号及相关新闻 |
| 赛场造型 | 按下一站、赛季和车队检查官方特别涂装与赛车服发布；已核对车手的图片单独标明身份 |
| 赛道档案 | 赛道资料、立体布局与历史信息 |
| 赛道天气 | 比赛地当前天气、比赛时段预报与逐小时天气 |
| 数据分析 | 双车遥测对比、轮胎策略、技术资料与争冠积分情景分析 |
| 观赛中心 | 五星体育入口、腾讯视频网页版与 App 唤起、按设备提供的脚本安装说明 |
| 赛事回放 | 按赛季、分站和场次生成 B 站与腾讯视频检索入口，支持正赛、排位赛、冲刺赛及练习赛 |
| 探索与设置 | 精选新闻、经典比赛、F1 百科、规则资料、多套配色、可搜索的 IANA 时区及夏令时处理 |
| 账号系统 | 邮箱密码登录、注册验证、密码找回、保持登录、可裁剪并随账号同步的私有头像；正式站要求登录后访问 |

回放入口使用比赛关键词检索第三方平台，不托管比赛视频。新闻为精选中文简报；赛事、遥测和技术资料的可用范围取决于上游已发布的数据。

赛场造型按官方发布情况提供，未取得匹配图片时明确提示暂缺，不将队友的赛车图作为该车手实车。头像部署与数据边界见 [个人资料功能说明](docs/profile-features.md)。外观、关注和时区偏好仍保存在当前设备。

## 技术架构

- **界面**：React 19、TypeScript、响应式 CSS。
- **构建与运行**：Vite、Vinext、Cloudflare Workers。
- **立体赛道**：Three.js。
- **数据层**：同源服务端路由、参数校验、缓存与带时间标记的快照回退。
- **持续检查**：GitHub Actions 执行类型检查、功能校验与生产构建。

```text
app/                   页面、界面组件与服务端 API 路由
lib/                   赛事、天气、遥测、回放与积分计算逻辑
public/                图片、字体、模型、脚本和下载资源
scripts/               功能校验与资源索引生成脚本
docs/                  项目文档与界面截图
.github/workflows/     持续集成配置
worker.ts              Cloudflare Worker 入口
wrangler.jsonc         Worker、静态资源与域名配置
```

## 本地开发

使用 **Node.js 24** 与 npm。依赖版本由 `package-lock.json` 锁定。

```bash
npm ci
npm run dev
```

开发服务器默认地址为 `http://127.0.0.1:5174`。

```bash
npm run check     # 类型检查与功能校验
npm run build     # 生产构建
npm run preview   # 预览已构建版本
```

修改头像源资料后，运行 `node scripts/build-portrait-index.mjs` 重新生成浏览器使用的精简索引，再执行检查。完整图片来源和版权记录继续保留。

## 部署

项目需要服务端路由，请使用 **Cloudflare Workers** 部署完整构建。

| 配置项 | 当前设置 |
| --- | --- |
| Worker 名称 | `paddock-pocket`，与 `wrangler.jsonc` 一致 |
| 生产分支 | `main` |
| 仓库根目录 | `/` |
| Node.js | `24` |
| 构建命令 | `npm run check && npm run build` |
| 部署命令 | `npm run deploy` |

将 Cloudflare 的 Git 集成连接到本仓库，并使用上表配置。部署后检查构建记录和实际线上页面；如果推送后未触发构建，可在 Cloudflare 的构建详情页使用 **Retry build** 手动触发。

通过本地命令部署时，先完成自己的 Cloudflare 登录，并根据部署目标调整 `wrangler.jsonc` 中的 Worker 名称及域名：

```bash
npx wrangler login
npm run check
npm run build
npm run deploy
```

正式地址展示为 `F1.xiaodinglab.com`；域名不区分大小写，浏览器可能将其规范化为 `f1.xiaodinglab.com`。根域名 `xiaodinglab.com` 保留兼容访问。

### 免费账号服务

账号功能使用 Supabase Auth Free 与 Resend Free，接入本站界面和同源接口。见 [配置与验收步骤](docs/authentication-setup.md)。新部署默认 `AUTH_MODE=off`，完成邮件验证、密码恢复和接口鉴权验收后再设为 `required`；本站正式环境已启用 `required`。免费额度用尽或服务故障不会自动切换付费套餐。服务商的免费额度和闲置暂停规则见配置文档。

## 平台与数据说明

- 网页支持手机、平板与桌面浏览器；iPhone / iPad 可通过 Safari 添加到主屏幕。
- Android APK 目前作为预览版提供下载，其原生工程独立维护；本仓库以网页版和服务端部署为主。
- Apple Watch 原生应用、表盘复杂功能及智能叠放组件尚未提供。
- 赛事数据更新失败时，界面会显示可用的缓存或快照及其获取时间，不将历史快照标记为实时数据。
- 天气在页面处于前台且联网时按赛程调整更新频率：比赛场次前后更频繁，其他时段降低频率。
- 偏好设置保存在当前设备浏览器中。网站部署后，访问者使用网站不需要维护者的电脑持续开机。

## 致谢与资源来源

感谢以下项目与资源为围场口袋提供参考和支持：

- **[F1Push（发车格）](https://f1push.com/)**：为赛事信息组织及部分交互提供参考。当前版本的部分赛事、积分、遥测和技术资料使用其数据服务；本项目维护接口接入、校验、缓存和页面呈现。接入代码见 [`app/api/data/route.ts`](app/api/data/route.ts) 与 [`lib/tool-data.ts`](lib/tool-data.ts)。
- **[Popukok/smg_live](https://github.com/Popukok/smg_live)**：五星体育观看辅助脚本的上游项目。围场口袋随附维护者提供的优化适配版本，并提供电脑、iPhone / iPad 和 Android 安装引导。脚本采用 MIT 许可，保留 `Copyright (c) 2025 _xFox`；见 [许可证](public/user-scripts/LICENSE)、[Android 许可证](public/user-scripts/ANDROID-LICENSE) 与 [版本及校验记录](public/user-scripts/SOURCE.md)。

随附 SMG 版本为电脑 `0.24`、iOS / iPadOS 主脚本及请求助手 `0.24.1`、Android `0.25.0`，可能与上游最新版本不同。脚本涉及播放请求、节目字段及播放器来源处理，需要用户安装并授权脚本管理器；网页不会自动安装扩展或向第三方内嵌页面注入脚本。

| 来源 | 用途 | 署名与许可记录 |
| --- | --- | --- |
| [Open-Meteo](https://open-meteo.com/) | 赛道周边当前天气与预报 | 页面保留数据来源、CC BY 4.0 标注及获取时间 |
| Formula 1 官方网站及历史图片来源 | 车手头像 | [当前车手](public/drivers/credits.json) · [历史车手](public/drivers/history/credits.json) |
| [bacinger/f1-circuits](https://github.com/bacinger/f1-circuits) | 赛道坐标与立体模型基础数据 | [模型来源、修改与 MIT 许可](public/circuits/models/credits.json) |
| Barlow Project / Google Fonts | Barlow Condensed 字体 | [SIL Open Font License 1.1](public/fonts/OFL-Barlow-Condensed.txt) · [字体来源](public/fonts/sources.json) |

## 许可证

本仓库尚未为项目自有代码设置统一的开源许可证。第三方脚本、图片、字体、赛道数据及其他资源的授权范围，以各自的许可证和来源记录为准。

围场口袋由本项目维护者独立开发与维护，与 Formula 1、F1Push 及观赛平台不存在官方隶属或背书关系。参考其产品或接入其服务不代表取得其代码、数据与素材的统一开源授权。
