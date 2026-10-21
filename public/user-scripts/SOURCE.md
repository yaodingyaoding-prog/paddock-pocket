# 用户提交的 SMG 优化版

发布范围沿用本站现有分享权限。来源文件由用户提供；网站不执行脚本，Android 独立观赛窗口由用户点击后加载随包安卓版本。
本地README和Git来源：Popukok/smg_live；用户先前给出的IAmTomShaw/f1-race-replay为另一个数据可视化项目。

这些文件与收到的原文件字节一致，保留元数据、作者与更新地址。Windows普通版可能自动更新至上游，用户修改版应自行核对更新设置。

- smg_fivestar.user.js: SHA256 57ba8627a24908c3240ac9655cf1d65b86ece7ff8cadff14c42fb3639e37ff13
- smg_fivestar.ipad.user.js: SHA256 14827e884e2b908199c6e01f8f694d6e5781f6330b037edc203bde786c9301c3
- smg_fivestar.ipad-helper.user.js: SHA256 bd565d1ece7dd809dbf07f4dcd4907fcaf0afefa086aa8f6bf99349edf5f5598

安装及运行需要用户主动选择脚本管理器并授权来源网站。iOS/iPadOS两个脚本须顶层运行；网站内嵌播放器不会自动加载脚本。代码含节目限制字段改写及播放器来源替换，不能描述为仅样式优化。未验证服务端权限、节目正确性或长期播放。

## Android 0.25.0

由用户放入 smg_live/android 的单文件脚本及 ZIP 传输包；它不是独立 APK。浏览器依赖脚本管理器；围场口袋 APK 在独立官方页面窗口通过 WebView 加载此原文件，不添加原生跨域请求桥，不关闭同源策略，实际播放需另行实测。

- smg_fivestar.android.user.js: SHA256 13e7bde2a7901cdb40f6dfd4736a0edc44380e7d0d8fb750c86af0d600e925c7
- SMG-Android-0.25.0.zip: SHA256 95492583a158d176248b7a5d167610010b7b672620cc2ec3061dc081c61d6da5
- android-install.txt: SHA256 2c915190ca4d3a5f6b5a5bbd6e61b170a2b129fd5c52bbbd62182518ce1d19ae

许可：ANDROID-LICENSE（MIT）。腾讯 App 唤起路径来自 https://m.v.qq.com/ 的公开页面，2026-10-21 核对；iOS 唤起尚未真机验证。
