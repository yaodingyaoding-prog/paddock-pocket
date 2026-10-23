# Contributing / 参与贡献

Issues and pull requests are welcome. For bugs, include the page, reproduction steps, expected behavior, browser / OS versions and a screenshot with personal information removed. For data issues, specify the season, Grand Prix, session and driver.

欢迎提交问题与改进。数据问题请注明赛季、分站、场次与车手，截图应遮去个人信息。安全问题请先阅读 [SECURITY.md](SECURITY.md)。

## Development

Use Node.js 24 and `npm ci`. Before submitting a change, run:

```bash
npm run check
npm run build
```

Keep changes focused. Update both READMEs when user-visible behavior changes. Match the existing route / controller / service boundaries for account and data work. Add meaningful checks for changed behavior, rather than tests that only repeat implementation text.

For Android, use [the native build guide](native/android/README.md). Package metadata, download metadata and the website must agree. Preserve the package and certificate for an update to an existing installation; forks should manage their own identity and signing files.

## Assets and credentials

Retain all applicable source and license records when adding images, fonts, models, scripts or data. Do not label upstream material as original work or assume that an image source link grants reuse rights.

Never commit real environment files, passwords, cookies, verification links, API secrets, keystores, private account exports or local build output. Use `.env.example` for placeholders. Follow [third-party notices](THIRD_PARTY_NOTICES.md) alongside the project [MIT license](LICENSE).
