# Security / 安全问题

Do not put passwords, cookies, session tokens, verification links, private keys or personal account records in a public issue, pull request, screenshot or log.

If the repository's Security tab offers **Report a vulnerability**, use that private report flow. Otherwise contact the maintainer through an existing private channel before sharing reproduction details. A public issue may request a private contact without including exploit details or personal data. Response times are not guaranteed.

请勿在公开 Issue 中发送账号凭据或可被利用的漏洞细节。优先使用 GitHub 已启用时的私密漏洞报告功能，或通过与维护者已有的私下联系渠道沟通。

## Deployment responsibilities

Self-hosters control their Cloudflare, Supabase and SMTP configuration. Use separate projects and secrets, private avatar storage with owner-path policies, HTTPS in production, and the documented authentication acceptance checks. A development instance with `AUTH_MODE=off` does not enforce login.

The downloadable Android APK is a preview channel. It uses the current maintainer-managed preview certificate and is not an app-store production signing release. Native device acceptance remains pending. APK checksums and certificate digests are published in the download metadata; forks must use their own signing setup and protect its private key.
