# 免费账号系统配置

本项目使用 Supabase Auth 和 SMTP 邮件服务，网站运行于 Cloudflare Workers。当前正式站使用 Supabase 与 Resend 的免费套餐，只提供邮箱密码登录，不要求访客登录上述服务商账号。自行部署请创建自己的项目、发信域名和配置。

## 配置顺序

1. 创建 Supabase **Free** 项目，保存 Project URL 和 Publishable key。应用不需要 Secret key、service_role 或数据库密码。
2. 在 Resend **Free** 中验证独立发信子域名，例如 `auth.xiaodinglab.com`。按 Resend 当前页面给出的记录配置 DNS，不套用过时的记录示例；CNAME 使用 DNS only。
3. 在 Resend 创建仅允许 Sending access 且限定该发信域名的 API Key。密钥由维护者自行创建并填入 Supabase 的 SMTP Password，不能提交进 Git 或发在聊天里。
4. 在 Supabase 的 Authentication → Email / SMTP 设置开启自定义 SMTP，主机 `smtp.resend.com`，端口 `465`，用户名 `resend`，密码为上一步的 Resend Key；发信人可设为 `围场口袋`，邮箱 `no-reply@auth.xiaodinglab.com`。以服务商当前控制台显示为准。
5. Authentication → Sign In / Providers 启用 Email 登录及公开注册。与当前正式站一致的配置为**关闭注册的 Confirm email**、密码最小长度设为 6。注册后直接返回登录会话，但密码找回仍必须通过邮件验证。若自行部署选择开启 Confirm email，应用也支持验证邮件流程，须额外验收确认与重发。
6. Authentication → URL Configuration：Site URL 为 `https://f1.xiaodinglab.com`；Redirect URLs 添加 `https://f1.xiaodinglab.com/auth/confirm`。本机验收时另加 `http://127.0.0.1:5177/auth/confirm`，验收完成后可移除。
7. Authentication → Email Templates 中，Reset password 使用 [`email-templates/reset-password.html`](email-templates/reset-password.html)。如启用注册确认，Confirm signup 使用 [`email-templates/confirm-signup.html`](email-templates/confirm-signup.html)。主题可分别设为“重设你的围场口袋密码”“验证你的围场口袋账号”。保持邮件点击追踪关闭。
8. 在 Cloudflare 的 Worker 运行时变量与 Secrets 中配置下表，先保留 `AUTH_MODE=off`。配置后部署，并通过真实邮箱验收。
9. 验收实际启用的注册流程、密码登录、找回密码、退出和匿名接口拦截后，再向用户开放。验收匿名保护时须先将 `AUTH_MODE` 改为 `required` 并重新部署；`off` 不强制登录，不能用于证明接口已受保护。

上文的 `xiaodinglab.com` 与 `127.0.0.1:5177` 是本项目地址示例。Fork 时应全部替换为自己的域名及实际端口；仓库默认开发端口为 `5174`。Site URL、`AUTH_BASE_URL`、邮件回跳白名单与打开的应用来源应相互对应。

## Worker 配置

| 名称 | 类型 | 用途 |
| --- | --- | --- |
| `AUTH_MODE` | 变量 | `off` 为发布准备阶段；`required` 强制登录。缺失时默认为 `off`，不自动改变现有正式站访问方式 |
| `AUTH_BASE_URL` | 变量 | 生产环境 `https://f1.xiaodinglab.com`，不要包含末尾斜线 |
| `SUPABASE_URL` | 变量 | 项目地址，形如 `https://project-ref.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | 变量或 Secret | 本项目的 Publishable key，应用不使用管理密钥 |
| `AUTH_SESSION_SECRET` | Secret | 本地生成至少 32 个随机字符，用于短期密码重置授权；不与其他项目共用 |
| `AUTH_IP_LIMITER` / `AUTH_EMAIL_LIMITER` | Rate Limit 绑定 | 由 `wrangler.jsonc` 声明，不是文本环境变量 |

`wrangler.jsonc` 设置 `keep_vars=true`，后续代码部署保留控制台中的运行时变量；不要把正式环境密钥写进 Wrangler 配置。项目配置只在服务端读取。生产环境的 `AUTH_MODE=required` 一旦启用，即使账号配置缺失或服务故障，业务接口也会拒绝匿名请求，不自动退回公开模式。

## 本机开发

复制 `.env.example` 为被 Git 忽略的 `.dev.vars`，填入自己的配置。使用本机验收端口时设置 `AUTH_BASE_URL=http://127.0.0.1:5177`。

```bash
npm run check
npm run build
npm run preview -- --port 5177
```

`.dev.vars` 由 Cloudflare Vite 插件读取，不能放到 `public/` 下。构建可能将其复制到 `dist/server/` 供本机预览使用；整个 `dist/` 均被 Git 忽略，不能将本机构建目录当作公开下载文件上传。

## 免费额度与维护

自定义头像还需要一次性配置已有项目的私有 Storage 桶与本人路径 RLS，见 [个人资料功能说明](profile-features.md) 和 [SQL](avatar-storage.sql)。无需新服务或管理密钥；不要将头像桶设置为 public。

- Supabase Free 的活跃用户、Storage、数据库和出站流量分别受套餐额度约束，闲置项目可能暂停；以当前控制台及[套餐说明](https://supabase.com/pricing)为准。
- Resend 的发送额度由账号套餐决定，以[当前套餐说明](https://resend.com/pricing)为准。密码找回与启用时的注册验证、重发共用额度，不能承诺无限发信。
- Cloudflare 的请求限制在各节点近似执行，不是全球严格邮件计数；邮件额度仍以 Resend / Supabase 服务端限制为准。
- 域名年费属于已有网站费用，免费账号方案不免除原有域名续费。
- 维护者负责平台账号、配置备份、依赖升级及必要的账号删除操作。账号系统未提供付费服务等级承诺。

## 验收项目

- 未登录：主页跳转登录；`/api/data`、`/api/tools` 返回 401；不能通过 RSC 请求或接口后缀绕开检查。
- 注册：至少 6 位密码、重复密码一致；关闭 Confirm email 时注册成功并进入登录会话。若选择启用 Confirm email，验收确认前限制、验证邮件与重发流程。
- 邮件：QQ / 163 / iCloud 等实际目标邮箱收到重置邮件及启用时的注册确认邮件；链接回到本站，进入页面不会自动消耗令牌，用户点击确认后验证。
- 会话：Cookie 使用 HttpOnly；HTTPS 下使用 Secure；保持登录可选；响应私有且不共享缓存。
- 密码找回：需有效邮件验证与短期重置授权；过期或篡改的授权被拒绝；完成后撤销刷新会话并要求重新登录。
- 退出：清除本机账号 Cookie 和赛事缓存；网络失败不会将业务接口改成游客可用。
- 错误：来源不符、超大请求、无效输入、请求过频、平台故障都有对应提示，日志不输出密码、令牌或密钥。
- 浏览器：电脑、手机 Safari、微信内浏览器实测；窄屏无横向溢出，密码管理器可识别字段。

## 官方资料

- [Supabase 免费套餐](https://supabase.com/pricing)
- [Supabase 自定义 SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase Cookie 会话说明](https://supabase.com/docs/guides/auth/server-side/advanced-guide)
- [Supabase 邮件模板](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Resend 价格](https://resend.com/pricing)
- [Resend SMTP](https://resend.com/docs/send-with-smtp)
- [Cloudflare Rate Limiting API](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
