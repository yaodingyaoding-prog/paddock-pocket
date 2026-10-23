# 围场口袋 · Paddock Pocket

### 每个比赛周末，从这里开始。

为 F1 车迷打造的赛事与观赛应用。在一个界面里安排比赛周末、查看积分和赛道天气、对比遥测、寻找直播与回放，再为自己喜欢的车手留一个领奖台位置。

[在线体验](https://F1.xiaodinglab.com/) · [Android 0.6.0 预览版](https://f1.xiaodinglab.com/downloads/Paddock-Pocket-0.6.0.apk) · [English](README.en.md) · [反馈问题](https://github.com/yaodingyaoding-prog/paddock-pocket/issues)

![项目检查](https://github.com/yaodingyaoding-prog/paddock-pocket/actions/workflows/check.yml/badge.svg)

![围场口袋探索页面](docs/images/discover.jpg)

<details>
<summary>查看登录页面</summary>

![Paddock Pocket login](docs/images/login.jpg)

</details>

## 项目特色

围场口袋围绕实际观赛流程设计。赛程、积分、探索和我的构成四个主要入口，遥测、技术资料与回放等工具放在二级页面，手机、平板和电脑使用同一套应用。

- 首页直接拖动旋转 3D 赛道，结合比赛倒计时、周末场次和赛道档案了解下一站。
- 积分榜默认展示前五名，需要时展开全榜；点击车手查看所选赛季车号、生涯成绩、冠军年份、车队经历与动态。
- 天气匹配比赛地坐标和场次时间，比赛窗口提高刷新频率，远离比赛时降低请求次数。
- 个人页面采用超级执照风格的车迷通行证，支持上传裁剪头像、三席车手领奖台和独立车队关注。
- 10 套界面主题与 12 种点缀色可分别搭配，提供可搜索的 IANA 时区选择，处理夏令时。
- 浮动玻璃导航、页面过渡和持续动态的赛道登录页形成统一视觉体验；为偏好减少动态效果的设备提供适配。
- 网页与 Android 在线版共用正式站，网页界面和功能更新后，安装包内也能加载新版。

本项目开发并维护产品界面、交互与导航、天气与账号服务、数据接入及校验、缓存回退、设备适配和部署流程。上游服务与素材的具体用途见文末[致谢与资源来源](#致谢与资源来源)。

## 功能一览

| 模块 | 当前功能 |
| --- | --- |
| 赛事周末 | 赛季切换、分站赛程、场次倒计时、成绩、日历导出 |
| 积分与人物 | 车手及车队积分、可展开榜单、当前与历史车手头像、车手资料与生涯记录 |
| 赛道 | 首页交互式 3D 轮廓、赛道档案、布局与历史资料 |
| 天气 | 比赛地当前天气、逐小时预报、比赛时段天气与获取时间 |
| 数据工具 | 双车遥测对比、轮胎与进站记录、赛会消息、技术资料、夺冠条件计算 |
| 观赛 | 五星体育、腾讯视频网页版与 App 入口、分设备脚本配置说明 |
| 回放 | 按赛季、分站和正赛／排位／冲刺／练习赛生成 B 站与腾讯视频搜索入口 |
| 探索 | 围场新闻简报、经典比赛、F1 百科、规则资料 |
| 个人空间 | 自定义账号头像、车迷通行证、最多三位关注车手、车队关注、主题与时区设置 |
| 账号 | 邮箱密码注册与登录、保持登录、邮件找回密码、退出登录、私有头像存储 |
| Android | 在线 WebView 应用、桌面小组件、手动与应用内版本检查 |

## 使用指南

### 1. 创建账号与登录

打开 [F1.xiaodinglab.com](https://F1.xiaodinglab.com/)，选择创建账号，填写昵称、自己的邮箱和至少 6 个字符的密码。当前正式站注册后可直接进入，无需注册确认邮件。

登录时可选择保持登录。忘记密码时，在登录页选择“忘记密码”，填写注册邮箱，打开邮件中的链接，按页面提示确认并设置新密码，再重新登录。请使用自己能够收信的邮箱。

自行部署者可以在 Supabase 开启注册邮箱确认；应用同时兼容需要确认和即时注册两种流程。

### 2. 安排比赛周末

进入“赛程”选择赛季和分站，查看练习、排位、冲刺与正赛安排。首页赛道支持直接拖动旋转，视角控制可恢复初始位置；打开赛道档案查看更多资料。已发布的场次可查看成绩，也可导出日历提醒。

在“我的”中选择时区，赛程会按设置显示。天气使用比赛地的位置，场次预报匹配该场次的时间；距离比赛太远、尚未进入预报范围时会提示，历史比赛不会被当作未来预报。

### 3. 查看积分与关注车手

进入“积分”，点击榜单底部按钮展开完整排名。点击车手行进入资料页，查看资料、生涯与相关新闻；车号跟随所选赛季。

在“我的”中设置最多三位关注车手，他们会出现在个人领奖台。车队可以单独关注。点击通行证头像，从相册选择图片，拖动、缩放并确认裁剪；保存的头像随账号同步。

主题、点缀色、时区和关注选择保存在当前设备；这些偏好目前不会随账号跨设备同步。头像会随账号同步。

### 4. 直播与回放

在“探索 → 观赛中心”选择五星体育或腾讯视频。腾讯视频提供网页版与打开 App 两个入口，App 唤起需要设备已安装相应应用，并受浏览器限制。

五星体育的“播放设置”会识别设备，也可以手动切换：

| 设备 | 使用方式 |
| --- | --- |
| 电脑 | 在支持的浏览器安装脚本管理器，导入电脑脚本，再在同一浏览器打开看看新闻 |
| iPhone / iPad | 在 Safari 启用 Userscripts，将 iOS 主脚本和请求助手放入选定目录，按页面说明授予网站访问权限 |
| Android 浏览器 | 使用支持脚本管理器的浏览器，导入 Android 单文件脚本；ZIP 是脚本传输包，不是 APK |
| 围场口袋 Android App | 从观赛入口按提示打开独立观看窗口；实际播放仍受节目、网络与上游平台状态影响 |

网页不能自动安装扩展，也不能将脚本注入第三方跨域播放器。首次配置以应用内步骤及[脚本来源记录](public/user-scripts/SOURCE.md)为准。

在“探索 → 赛事回放”选择赛季、场次类型并搜索分站，点击 B 站或腾讯视频按钮即可检索。入口使用比赛关键词搜索，未逐条核验视频，不保证每场都有完整回放。视频由对应平台提供，可能要求登录、会员或地区权限。

### 5. 使用数据工具

在“探索 → 遥测分析”选择已发布数据的比赛场次和两位车手，对比速度、油门等记录，并查看轮胎、进站及赛会消息。覆盖范围取决于上游数据，空缺不会生成模拟读数。

在“积分 → 夺冠条件”选择车手、假设正赛名次及适用的冲刺名次，查看下一站提前锁冠需要满足的对手条件。当前配置针对 2026 赛季的完整积分规则，展示积分情景而非夺冠概率；赛事已经开始、资料不完整或同分规则无法充分判定时会保留提示。取消、缩短比赛与处罚等变动需要重新核对。

## 平台与更新

| 平台 | 使用方式 | 更新与限制 |
| --- | --- | --- |
| 手机／平板／桌面浏览器 | 直接访问正式站 | 页面重载后加载最新发布版本，需要联网 |
| iPhone / iPad 主屏幕 | Safari → 分享 → 添加到主屏幕 | 是网页入口，不包含原生 iOS 或 Apple Watch 小组件 |
| Android 8.0 及以上 | 安装 0.6.0 预览 APK | 主要页面跟随正式站；原生更新需要下载并由用户确认安装 |
| Android 桌面小组件 | 安装 App 后从系统小组件列表添加 | 显示下场比赛倒计时、天气与最多三位关注车手；刷新受系统电量及网络调度影响 |

Android 0.6.0 的包名为 `dev.paddock.pocket`，`versionCode=6`。应用打开时检查原生版本，也提供手动检查；不提供静默安装或后台推送更新。0.5.0 用户需要先手动升级到 0.6.0。安装同包名更新需要保留原签名证书。

当前 APK 使用预览证书。Java 编译、签名与 ZIP 对齐已检查，Android 真机上的登录、相册、播放、更新提示和不同启动器的小组件仍需验收。下载校验见 [`android-build.json`](public/downloads/android-build.json)，原生源码与构建要求见 [`native/android`](native/android)。

Apple Watch 原生应用、表盘复杂功能和智能叠放组件尚未提供。

## 本地运行

建议使用 **Node.js 24**，与仓库 `.node-version` 和 CI 保持一致，并使用 npm 安装锁定依赖。

```bash
git clone https://github.com/yaodingyaoding-prog/paddock-pocket.git
cd paddock-pocket
npm ci
npm run dev
```

打开 `http://127.0.0.1:5174`。未配置账号服务时，`AUTH_MODE` 默认为 `off`，可以开发主要赛事界面；注册、头像等账号功能需要下节配置。赛事和天气仍需要访问上游网络。

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 启动本地开发服务，默认端口 5174 |
| `npm run check` | 类型检查及认证、天气、回放、遥测、积分条件等校验 |
| `npm run build` | 生成生产构建 |
| `npm run preview` | 预览已有构建，默认端口 5174 |
| `npm run deploy` | 将构建部署到 Cloudflare Workers |

仅构建完成后才能使用 `preview`。本机 `127.0.0.1` 地址只能由本机打开。

### 配置账号、邮件与头像

复制 `.env.example` 为 `.dev.vars`，填写自己的配置。不要使用本站的 Supabase 项目或发信域名。

```dotenv
AUTH_MODE=required
AUTH_BASE_URL=http://127.0.0.1:5174
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
AUTH_SESSION_SECRET=YOUR_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
```

以上是占位内容。配置含义：

| 变量 | 配置要求 |
| --- | --- |
| `AUTH_MODE` | `off` 关闭强制登录；`required` 要求登录并保护业务接口 |
| `AUTH_BASE_URL` | 应用来源地址，不带末尾斜线；正式环境使用自己的 HTTPS 域名 |
| `SUPABASE_URL` | 自己的 Supabase Project URL |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_` 开头的 Publishable key；无需管理密钥 |
| `AUTH_SESSION_SECRET` | 每个部署独立生成至少 32 个随机字符，用于短期密码恢复授权 |

创建自己的 Supabase 项目，启用 Email 登录与注册，并设置 Site URL 和 `/auth/confirm` 回跳地址。要与正式站一致，关闭注册的 Confirm email，密码最小长度设为 6；密码找回仍需邮件验证。若选择开启 Confirm email，须配置注册确认邮件模板。

通过 Resend 或 Supabase 支持的 SMTP 配置密码恢复邮件。Resend API Key 只填入 Supabase SMTP Password，不放进前端或仓库。头像需要在自己的项目中审核并执行一次 [`docs/avatar-storage.sql`](docs/avatar-storage.sql)，创建私有桶及本人路径访问策略。

完整步骤见[账号配置指南](docs/authentication-setup.md)和[头像配置说明](docs/profile-features.md)。本机配置变更后重启服务；生产密钥配置在 Cloudflare 运行时 Secrets。`.dev.vars`、真实 `.env` 文件和构建输出均不应提交或公开下载。

## 部署到 Cloudflare Workers

项目包含服务端路由，需部署完整 Worker 与静态资源。单独上传静态文件无法提供账号、天气和数据接口。

1. Fork 仓库或复制到自己的仓库。
2. 修改 `wrangler.jsonc` 的 Worker `name`；删除现有 `routes` 中的本站域名，或替换为自己拥有的域名。初次部署可保留 `workers_dev=true` 使用自己的测试地址。
3. 在 Cloudflare Workers 连接自己的 GitHub 仓库，使用以下构建配置。
4. 按账号配置指南设置生产运行时变量与 Secrets，并在 Supabase 添加正式站回跳地址。
5. 部署后验收注册、登录、密码恢复、头像、匿名接口保护和主要赛事页面，再向用户开放。

| 配置项 | 值 |
| --- | --- |
| Node.js | `24` |
| 仓库根目录 | `/` |
| 生产分支 | `main` |
| 构建命令 | `npm run check && npm run build` |
| 部署命令 | `npm run deploy` |

也可在本地完成 Cloudflare 授权后部署：

```bash
npx wrangler login
npm run check
npm run build
npm run deploy
```

`wrangler.jsonc` 声明认证限流绑定，并通过 `keep_vars=true` 保留控制台变量。`AUTH_MODE=required` 启用后，账号配置缺失或服务失败不会自动恢复匿名访问。

本项目可使用 Cloudflare、Supabase 与 Resend 的免费套餐起步；各服务的额度、可用性与暂停规则以服务商当前说明为准。域名费用独立计算。部署后由云端处理请求，不需要维护者电脑一直开机。

### 构建自己的 Android 版本

源码位于 [`native/android`](native/android)。目前使用 PowerShell 构建脚本，需自行准备 JDK、Android 平台 SDK、AAPT2、D8/R8、zipalign 与 apksigner，具体文件布局见该目录说明。

Fork 部署后，需同步修改原生源码中的网站及更新下载地址；分发自己的应用还需调整包名、版本与签名方案。当前脚本使用预览签名流程，仓库不包含维护者私有签名文件。它不是开箱即用的应用商店发布配置。

## 架构与目录

React 19、TypeScript 和响应式 CSS 构建界面，Vite / Vinext 配合 Cloudflare Workers 运行服务端路由，Three.js 绘制赛道，Supabase Auth / Storage 提供账号与头像。Resend 通过 Supabase SMTP 发送邮件。

```text
app/                   页面、交互组件与 API 路由
lib/                   赛事、天气、遥测、账号、回放与积分逻辑
components/            通用界面组件
public/                图片、模型、字体、脚本及 APK 下载
native/android/        Android 应用、小组件与构建脚本
scripts/               类型及功能校验、头像索引生成
docs/                  配置、功能说明、SQL 与截图
.github/workflows/     GitHub Actions 检查与构建
worker.ts              Worker 入口
wrangler.jsonc         部署、域名、静态资源和限流绑定
```

修改头像来源后，运行 `node scripts/build-portrait-index.mjs` 更新浏览器索引，并保留来源及版权记录。CI 执行 `npm ci`、`npm run check` 和 `npm run build`。

## 数据更新与功能边界

- 赛事、积分、车手资料、遥测与部分技术资料依赖 F1Push 数据服务。抓取时间表示本项目获取数据的时间，不保证与赛道实时计时同步。失败时只在有对应快照的资源中回退，并标明快照时间。
- 天气来自 Open-Meteo。页面前台联网时，场次开始前 30 分钟至结束后 30 分钟约每 5 分钟检查；未来 48 小时内有场次时约每小时；其他时段约每 3 小时。服务端另有缓存，失败时可展示不超过 6 小时的旧数据并明确标注。网页关闭后不会继续定时刷新。
- 新闻为有来源的中文编辑简报，不是持续抓取所有平台的全文资讯服务。经典比赛为编辑精选，不是用户投票排名。
- 部分历史车手头像与资料可能缺失；特别涂装和赛车服取决于可匹配的官方发布，不保证每站每队都有素材。
- 当前应用界面主要为中文；英文 README 是项目文档，不代表全站已有英文界面。
- 当前未接入 Apple Sports 账号或数据，也没有夺冠概率模型、原生 iOS App 或 watchOS 组件。

## 参与与反馈

欢迎通过 [Issues](https://github.com/yaodingyaoding-prog/paddock-pocket/issues) 提交问题与建议。请附上页面位置、复现步骤、浏览器／系统版本，以及已遮去个人信息的截图。数据问题请注明赛季、分站、场次或车手。

提交修改前运行 `npm run check` 和 `npm run build`。涉及图片、模型、脚本或数据来源的变更，请同时补全出处与许可记录。不要在 Issue、提交或截图中包含密码、Cookie、验证链接、密钥或私人账号数据。

如果围场口袋对你有帮助，欢迎在 [GitHub](https://github.com/yaodingyaoding-prog/paddock-pocket) 点亮 Star。

## 致谢与资源来源

感谢为项目提供参考、数据及资源的开发者：

| 项目或资源 | 在围场口袋中的用途 | 记录 |
| --- | --- | --- |
| [F1Push · 发车格](https://f1push.com/) | 赛事信息组织及部分交互参考；当前部分赛事、积分、车手、遥测与技术数据上游 | [赛事接口](app/api/data/route.ts)、[工具接入](lib/tool-data.ts)、[车手接入](lib/drivers/DriverRepository.ts) |
| [Popukok/smg_live](https://github.com/Popukok/smg_live) | 五星体育观看辅助脚本上游；随附维护者提供的设备适配版本和安装指南 | [来源及 SHA-256](public/user-scripts/SOURCE.md)、[MIT 许可](public/user-scripts/LICENSE)、[Android 许可](public/user-scripts/ANDROID-LICENSE) |
| [Open-Meteo](https://open-meteo.com/) | 比赛地当前天气与预报 | 界面保留来源、CC BY 4.0 标注与获取时间 |
| Formula 1 官方网站及历史图片来源 | 车手头像与部分赛事素材 | [当前头像记录](public/drivers/credits.json)、[历史头像记录](public/drivers/history/credits.json)、[赛事素材说明](docs/profile-features.md) |
| [bacinger/f1-circuits](https://github.com/bacinger/f1-circuits) | 赛道坐标及 3D 模型基础数据 | [来源与修改记录](public/circuits/models/credits.json)、[MIT 许可](public/circuits/models/LICENSE.txt) |
| Barlow Project / Google Fonts | 本地托管的 Barlow Condensed 字体 | [来源](public/fonts/sources.json)、[SIL OFL 1.1](public/fonts/OFL-Barlow-Condensed.txt) |

随附 SMG 版本为电脑 `0.24`、iOS / iPadOS 主脚本及请求助手 `0.24.1`、Android `0.25.0`，保留上游 `Copyright (c) 2025 _xFox`。这些版本可能与上游最新版不同；脚本涉及播放请求、节目字段与播放器来源处理，具体行为和校验记录见来源文档。

## 许可与项目身份

本仓库正准备公开发布，项目自有代码尚未设置统一开源许可证。公开源码与授予开源许可是两件事，后续许可范围将以根目录 `LICENSE` 文件为准。

第三方脚本、字体、模型、数据、图片和商标分别适用其原有许可或权利说明，不因源码公开而转为项目原创或统一获得开放授权。图片来源记录不等于取得图片的开源许可。

围场口袋是独立的车迷项目，与 Formula 1、F1Push、五星体育及相关观赛平台无官方隶属或背书关系。
