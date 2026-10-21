# 围场口袋 · 独立网页版

保留现有赛程、排名、天气、赛道、遥测、新闻与观赛入口。使用自己的 Cloudflare Workers 账号运行，不依赖 ChatGPT 登录或 Sites 访问令牌。

## 本地

Node.js 24，npm ci，npm run dev。检查：npm run check。生产构建：npm run build。已构建版本本地预览：npm run preview。

## Cloudflare Git 自动部署

将此目录推送到自己的 GitHub 私有仓库。Cloudflare Workers & Pages → Create application → Import a repository → GitHub，授权时仅选择此仓库。

- Worker 名称：paddock-pocket（须与 wrangler.jsonc 一致）
- 根目录：仓库根目录
- 构建命令：npm run check && npm run build
- 部署命令：npm run deploy
- Node.js：24（如需，在构建变量设置 NODE_VERSION=24）

使用 Workers Git 集成进行部署，不要再配置第二套 GitHub Actions 部署。Actions 工作流仅检查，不需要部署令牌。首次可用额度需结合实际包大小、CPU 和流量验证；未经用户同意不升级付费。

上线后验证：匿名首页、/api/data?resource=seasons、/api/tools 的参数拒绝、头像、3D 模型、脚本下载和 APK 下载；再请用户在 iPhone 与朋友网络测试。部署成功本身不代表每种网络都可访问。

## 数据与更新

赛事接口仍在服务器上运行；不把需要同源代理的数据改为浏览器直接跨域请求。上游错误时保留现有快照回退与时间标记。天气由用户设备向 Open-Meteo 获取，保留现有按赛程更新频率。服务器托管后无需自己的电脑一直开机。

## 文件与权限

此目录只包含网站源码、公开资源、版权记录和构建配置，不包含原参考 APK、Android 签名密钥、SDK、个人账号、Cookie 或云端令牌。静态资源的署名记录保留在 public 中。不要将 .env、.dev.vars 或 .wrangler 上传到仓库。

未来优化以此仓库为源；推送到关联生产分支后由 Cloudflare 自动构建发布。现有 Sites 站点保持不动，等待独立网址验收后再决定是否停用。

## 首屏加载

头像运行索引由 `node scripts/build-portrait-index.mjs` 从完整资料生成。修改头像资料后重新生成并运行 `npm run check`；检查会验证现有姓名与身份匹配结果。完整研究与版权记录继续保留，不进入首屏 JavaScript。

HTML 自带一个不依赖 React 的启动提示：应用 12 秒内未启动或主脚本下载失败时显示重试按钮，启动成功自动隐藏。它只能说明启动未完成，不能修复网络到托管服务器的连接故障。
