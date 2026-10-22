# 头像、车手档案与比赛周末造型

更新：2026-10-22。

## 自定义账号头像

“我的”→ 点击头像 → 从相册选择，支持拖动、缩放与位置滑块，保存前显示圆形裁剪预览。支持浏览器可解码的 JPEG、PNG、WebP，以及设备支持的 HEIC/HEIF。原图上限 10 MB、4000 万像素；浏览器输出 256 × 256 WebP，并清理编码器附加的 ICC、EXIF 和 XMP 块。服务器限制静态 WebP、尺寸、结构与 128 KiB 大小，不接受 SVG 或动画。结构检查不等同于完整图像解码。

使用已有 Supabase Auth 与 Storage。私有桶 `paddock-avatars` 每个账号只保存 `{auth.uid()}/avatar.webp`，RLS 的读取、插入、更新、删除都限定到本人路径。应用不使用 service_role；不提供任意用户 ID 或任意文件路径参数。浏览器经本站已登录接口读取，响应为 `private, no-store`，变更操作校验 Origin 并使用已有请求限流。

裁剪图保存至账号，其他设备重新读取账号状态后生效；已打开页面约每 60 秒或恢复可见时读取状态。恢复默认会删除当前头像对象并清除版本标记，不保留应用内头像历史。外观、关注与时区继续只保存在设备上。上传存储与账号元数据更新为两步，网络故障时提示失败，可重试；不承诺跨服务事务。

新部署须由项目维护者在 Supabase SQL Editor 审核并执行 [avatar-storage.sql](avatar-storage.sql) **一次**。SQL 使用事务创建私有桶及四项策略；重复执行会因同名策略已存在而回滚，不应通过删除已有策略来重跑。已有正式项目已配置。存储和流量计入已有免费套餐额度，不保证无限容量。

## 车号与生涯数据

页首车号来自所选赛季积分数据，不被当前全局车号覆盖。维斯塔潘 33 号为 2015–2021 年历史车号，2022–2025 使用 1 号，2026 使用 3 号；汉密尔顿使用 44 号。通用车队素材可能带队友车号，因此不再作为个人实车显示。

车手详情分为资料、生涯与动态。资料与累计统计使用 F1Push 公开的车手 profile/statistics 接口，经身份匹配与结构校验后缓存一小时；缺失统计显示破折号。冠军年份仅取已结束赛季的第一名记录，并受累计冠军数限制。生涯累计数据和上方所选赛季的积分分开展示。绰号与人物简介是有出处的编辑资料，目前覆盖部分车手，未核实内容不生成。

## 下一站特别涂装与赛车服

按下一站赛事 ID、赛季、车队匹配 F1 官方 RSS 的发布文章，并检查文章发布时间（比赛开始前 14 天至结束后 1 天）、图片域名与文件类型。仅使用官方 `media.formula1.com/image/upload/` 图片；拒绝重定向，不接受任意远程地址或 SVG。

比赛开始前七天至结束后一天，缓存检查间隔为 60 分钟，其他时间为 6 小时，上游失败短暂缓存 5 分钟。用户打开页面时由 Cloudflare Worker 按缓存状态检查，不需要维护者电脑开机；没有独立后台定时抓取任务。服务器实例重建可能提前检查，不能视为严格定时器。

官方车队发布图只标注为车队涂装或赛车服，不自动推断具体车手。只有人工核对过车号的图片才显示“车手图片已核对”。当前包含 2026 美国站法拉利汉密尔顿 44 号与勒克莱尔 16 号的已核对素材。未匹配到发布或历史赛季素材时显示暂缺，不伪造下一站照片，也不保证每队每站都有特别造型。

图片版权归 F1、车队与摄影者等原权利人，展示时保留官方发布出处；项目未取得这些图片的开放许可，不将其声明为项目原创或纳入代码许可。新增人工核对记录保存在 `lib/race-media-seeds.ts`。

## 架构与验证

后端采用 route → controller → service → repository；参数校验与有界读取独立于界面。BFRI：架构适配 5、可测试性 5，复杂度 2、数据风险 2、运行风险 2，得分 4；以所有权检查、RLS、限流、脱敏日志及回归检查降低风险。沿用 Cloudflare 日志，不新增付费监控服务。

自动检查覆盖匿名和未验证账号拒绝、来源校验、超大与伪装文件、裁剪边界、编码器色彩配置清理、纽约夏令时、车手身份与已完成冠军赛季、赛事/车队/年份不匹配及图片域名与重定向限制。人工实测真实 Supabase 上传、刷新读取与恢复默认；原有 62 项认证回归继续保留。

## 资料出处

- [F1：维斯塔潘 2026 使用 3 号](https://www.formula1.com/en/latest/article/max-verstappen-confirms-he-will-use-car-number-3-for-2026-season.6qvN2SQwcyGYnMWhGdDpNS)
- [F1：汉密尔顿资料](https://www.formula1.com/en/drivers/lewis-hamilton)
- [F1：法拉利 2026 美国站特别涂装](https://www.formula1.com/en/latest/article/gallery-ferrari-become-latest-team-to-unveil-special-livery-for-united-states-grand-prix.4EbG3ECmHt6RxHQYeFPkvD)
- [F1 官方新闻 RSS](https://www.formula1.com/en/latest/all.xml)
- [Supabase Storage 访问控制](https://supabase.com/docs/guides/storage/security/access-control)
