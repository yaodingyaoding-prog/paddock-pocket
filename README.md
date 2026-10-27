# 围场口袋 · Paddock Pocket

### 你的 F1 比赛周末，装进口袋。

围场口袋是一款为 F1 车迷打造的赛事与观赛应用，将赛程、积分、赛道天气、车手档案、观赛入口和数据分析放在一起。打开就能查看比赛，登录后拥有自己的车迷通行证、领奖台阵容和跨设备同步的个人设置。

[在线体验](https://F1.xiaodinglab.com/) · [下载 Android 1.0.3](https://f1.xiaodinglab.com/download) · [使用指南](docs/user-guide.md) · [English](README.en.md)

[![项目检查](https://github.com/yaodingyaoding-prog/paddock-pocket/actions/workflows/check.yml/badge.svg)](https://github.com/yaodingyaoding-prog/paddock-pocket/actions/workflows/check.yml) [![Android](https://img.shields.io/badge/Android-8.0%2B-3DDC84?logo=android&logoColor=white)](https://f1.xiaodinglab.com/download) [![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

![围场口袋：看赛程、查天气、找回放](public/social-cover.png)

## 为比赛周末设计

下一场几点开始、赛道会不会下雨、车手积分差多少、错过比赛去哪里回看。围场口袋围绕这些观赛需求组织信息，用赛程、积分、探索和我的四个主入口串起整个比赛周末。

项目独立设计并实现了产品界面、3D 赛道交互、玻璃导航与页面动效、个人领奖台、账号和头像系统、云端偏好同步、赛事数据接入与校验、Android 应用及桌面小组件，并维护完整的构建、测试和部署流程。

### 打开首页，就进入比赛周末

下一站大奖赛、场次倒计时、比赛时间安排和轮胎信息集中呈现。3D 赛道可直接拖动旋转，支持缩放和视角复位；进入赛道档案，还能查看布局、参数和历史资料。

赛程支持切换赛季、查看场次成绩、选择显示时区，并将比赛加入日历。你可以按自己的作息安排观赛，也可以按赛道当地时间了解比赛周末。

### 天气跟着赛道与场次走

天气板块按赛道坐标获取数据，在“当地此刻”和“比赛预报”之间切换。选择练习赛、排位赛或正赛，查看对应时段的天气、降水、风速和逐小时变化。比赛临近及进行期间会提高更新频率。

### 看积分，也读懂车手

积分榜先展示前五名，点击展开完整榜单。进入车手档案，可查看所选赛季的车号、车队、生涯成绩、冠军年份、历史经历和相关动态。车队积分与车手积分分别呈现，适合快速看排名，也适合深入查资料。

### 把自己的阵容带到每台设备

选择最多三位喜爱的车手，让他们站上你的个人领奖台；车队也可以独立关注。超级执照风格的车迷通行证搭配昵称和自定义头像，上传图片后可拖动、缩放并裁剪。

昵称、头像、关注车手与车队、主题、配色和时区随账号跨设备同步。手机上选好阵容，换到平板或电脑仍是熟悉的围场。“我的”会显示保存状态，设置修改后自动同步。

### 观赛、回放与分析都有入口

观赛中心整合五星体育观看配置，以及腾讯视频网页版和 App 入口；赛事回放按赛季、大奖赛及场次生成 Bilibili、腾讯视频搜索入口。

探索页还提供围场新闻、经典比赛、F1 百科、规则资料和技术分析。遥测工具支持双车数据对比，并可查看轮胎、进站和赛会消息；争冠条件工具根据假设名次计算下一站提前夺冠需要满足的对手条件。

### 让界面更像你的主场

10 套界面主题、12 种点缀色与可搜索时区，配合玻璃导航、不同层级的切换动效和持续动态的 F1 登录场景。界面适配手机、平板和桌面，也响应系统的减少动态效果设置。

赛程和个人领奖台支持生成带二维码的 PNG 分享海报，可调用系统分享、保存图片或复制链接。朋友打开阵容链接即可查看你的选择，自己的关注保持独立。

<details>
<summary>查看应用界面</summary>

![围场口袋探索界面](docs/images/discover.jpg)

</details>

## 开始使用

1. 打开 [F1.xiaodinglab.com](https://F1.xiaodinglab.com/)，直接浏览赛程、积分、天气、车手档案和回放入口。
2. 在“赛程”选择赛季和分站，查看场次时间、比赛预报与赛道资料；点击日历按钮保存观赛安排。
3. 在“积分”展开完整榜单，点击车手查看档案，点击爱心关注车手或车队。
4. 注册或登录账号，在“我的”上传头像、设置领奖台阵容，选择主题、配色和时区。显示“全部个人设置已同步”后，可在其他设备登录同一账号继续使用。
5. 在“探索 → 观赛中心”选择直播平台；需要回看时进入“赛事回放”，按赛季、分站和场次搜索。五星体育配置说明会根据设备提供对应步骤。
6. 使用“分享周末”或领奖台分享按钮，将比赛安排和自己的阵容分享给朋友。

忘记密码时，在登录页选择“忘记密码”，通过邮件验证后设置新密码。完整操作说明见[中文使用指南](docs/user-guide.md)。

## 手机、平板与 Android

| 平台 | 使用方式 | 体验 |
| --- | --- | --- |
| 手机、平板、电脑浏览器 | [直接打开网站](https://F1.xiaodinglab.com/) | 自适应界面，账号设置跨设备同步 |
| iPhone / iPad | Safari → 分享 → 添加到主屏幕 | 从主屏幕快速进入围场 |
| Android 8.0 及以上 | [下载 1.0.3 APK](https://f1.xiaodinglab.com/download) | 与正式站同步的界面、系统功能和桌面小组件 |

**Android 0.7.0 已由维护者完成真机验证，确认可正常使用。**

下载 APK 后按系统提示安装。应用提供系统图片选择、日历保存、观赛窗口、平台 App 唤起和版本检查。安装后可从系统小组件列表添加围场口袋，在桌面查看下场比赛倒计时、天气和关注车手。

网站更新后，App 重新加载即可使用新的页面与功能；原生功能更新通过新版 APK 安装。1.0.3 延续 `dev.paddock.pocket` 包名及与 0.6.0 相同的签名证书，支持覆盖升级。

[Android 发布说明](docs/android-release.md) · [文件校验与版本信息](public/downloads/android-build.json) · [更新记录](CHANGELOG.md)

## 本地开发

准备 **Node.js 24** 和 npm：

```bash
git clone https://github.com/yaodingyaoding-prog/paddock-pocket.git
cd paddock-pocket
npm ci
npm run dev
```

打开 `http://127.0.0.1:5174`。赛事界面可直接开始开发；账号、头像与云端设置使用自己的 Supabase 项目配置。

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动本地开发服务 |
| `npm run check` | 执行类型与功能检查 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览已有构建 |
| `npm run deploy` | 部署到 Cloudflare Workers |

检查覆盖认证与账号隔离、个人设置同步、头像、天气、遥测、回放、争冠条件、动效、分享和 APK 发布一致性。

## 微信小程序

已准备面向个人主体的 [微信原生工程与导入指南](native/wechat/README.md)，复用现有赛事 API 和账号云同步。部分页面已通过开发者工具模拟器验证，真机验收与发布状态见工程内说明。

## 自行部署

1. Fork 本仓库，修改 `wrangler.jsonc` 中的 Worker 名称，并将 `routes` 替换为自己的域名。
2. 创建 Supabase 项目，配置 Email 登录、SMTP 和 `/auth/confirm` 回跳地址。本站使用 Resend 发送账号邮件。
3. 复制 `.env.example` 为 `.dev.vars`，配置本地环境；将正式环境变量和 Secrets 填入 Cloudflare。
4. 在 Supabase 执行一次[头像存储 SQL](docs/avatar-storage.sql)及[账号设置 SQL](docs/account-preferences.sql)，配置私有头像和本人设置访问规则。
5. 运行检查与构建，将 Worker 和静态资源一同部署。

Cloudflare Git 构建使用 Node.js `24`，构建命令 `npm run check && npm run build`，部署命令 `npm run deploy`。

| 变量 | 用途 |
| --- | --- |
| `AUTH_MODE` | 本地开发使用 `off`；启用账号与私有路由保护使用 `required` |
| `AUTH_BASE_URL` | 应用的来源地址，正式环境使用 HTTPS |
| `SUPABASE_URL` | Supabase 项目地址 |
| `SUPABASE_PUBLISHABLE_KEY` | 项目的 Publishable key |
| `AUTH_SESSION_SECRET` | 至少 32 个随机字符的密码恢复授权密钥 |

环境文件和签名私钥保留在自己的部署环境中。详细配置见[账号服务](docs/authentication-setup.md)、[头像与车手资料](docs/profile-features.md)、[云端设置同步](docs/account-preferences.md)和[Android 构建指南](native/android/README.md)。

## 技术与项目结构

React 19 与 TypeScript 构建界面，Vite / Vinext 与 Cloudflare Workers 运行页面和服务端路由，Three.js 绘制交互赛道。Supabase Auth、Storage 与 PostgreSQL 分别承担账号认证、私有头像和个人设置同步。Android 原生层使用 Java、WebView 与 AppWidget。

```text
app/                   页面、交互组件与 API 路由
lib/                   赛事、天气、遥测、账号与同步逻辑
native/android/        Android 应用、小组件及构建脚本
native/wechat/         个人主体微信原生工程与接入说明
public/                图片、字体、模型、脚本和 APK
scripts/               功能验证、索引生成与 APK 发布
docs/                  使用、配置与发布文档
```

## 参与项目

欢迎通过 [Issue](https://github.com/yaodingyaoding-prog/paddock-pocket/issues) 分享想法、反馈问题，或提交 Pull Request。数据问题请注明赛季、分站、场次与车手；界面问题请附上系统、浏览器及复现步骤。提交前运行 `npm run check` 和 `npm run build`。

[贡献说明](CONTRIBUTING.md) · [安全反馈](SECURITY.md) · [更新记录](CHANGELOG.md) · [分享材料](docs/guest-sharing-launch.md)

喜欢围场口袋，欢迎点亮 Star，也欢迎把它分享给一起看比赛的朋友。

## 致谢与许可

感谢 [F1Push（发车格）](https://f1push.com/) 提供的信息组织与部分交互参考，以及部分赛事数据服务；感谢 [Popukok/smg_live](https://github.com/Popukok/smg_live) 提供五星体育观看辅助脚本上游。本项目维护自己的产品实现、设备适配、观看配置和接入流程，并保留相关署名与许可。

天气服务使用 Open-Meteo。图片、赛道数据、字体、脚本及其他依赖的来源和授权见[第三方资源说明](THIRD_PARTY_NOTICES.md)。项目自有代码与文档采用 [MIT License](LICENSE)，版权署名 `Copyright (c) 2026 yaodingyaoding-prog`；第三方内容保留各自的权利。

围场口袋是独立车迷项目，与 Formula 1、F1Push、五星体育及相关观赛平台无官方隶属或背书关系。
