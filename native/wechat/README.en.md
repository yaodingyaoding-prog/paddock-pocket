# Paddock Pocket · Native WeChat client

[简体中文](README.md) · [Main repository](https://github.com/yaodingyaoding-prog/paddock-pocket)

Version **0.1.0** is a native WXML/WXSS/JavaScript project prepared for an individual Mini Program account. It reuses the existing production race API and email account services. It contains ten pages across Schedule, Standings, Discover and Profile.

Implemented source covers seasons, rounds, session results, driver/team standings, driver career profiles, circuit weather, news summaries, replay search links, email authentication, existing cloud avatar display, account preferences and native share paths. Driver/team follows, themes, accents and time zones use the same cloud preferences as the website and Android app. Public race data has dated offline fallbacks.

## Import

1. Register an individual Mini Program at [WeChat Official Accounts Platform](https://mp.weixin.qq.com/) and obtain its AppID. Complete the actual category, filing, privacy and eligibility requirements shown in the console.
2. Import **this `native/wechat` directory** into WeChat DevTools, enter your own AppID, and keep domain verification enabled. Do not enter an AppSecret in client code.
3. Configure `https://f1.xiaodinglab.com` as the request domain; use the same origin for image download-domain configuration if required. Domain acceptance depends on the platform's actual checks and filing requirements.
4. Compile and preview on both Android WeChat and iPhone WeChat, then upload a trial build and submit for review only after acceptance testing.

Alternatively, `node scripts/configure.cjs wxYOUR_APP_ID` writes the local ignored AppID configuration. No runtime npm installation or client-side backend secrets are needed.

## Maintenance

From the full repository root:

```sh
node scripts/prepare-wechat.mjs
node native/wechat/tests/run.cjs
node native/wechat/tests/pages.cjs
node native/wechat/scripts/package.cjs
node native/wechat/tests/live.cjs
```

Generated seed data and compressed assets are already included in the standalone project. Detailed image attribution is shipped in `third-party/`, outside the runtime package. Own code is MIT licensed, copyright yaodingyaoding-prog. Existing project acknowledgments include F1Push and [f1-race-replay](https://github.com/IAmTomShaw/f1-race-replay); the Mini Program does not inject the viewing userscript.

Only session data, public race caches and temporary private avatar files are stored on the device; account preferences remain in the cloud. Auth requests are serialized and never automatically retried. Native Origin/Cookie behavior requires actual WeChat validation, without disabling server origin checks.

Viewing and replay links are copied for opening in a browser. Website 3D/telemetry components, avatar cropping/upload and Android viewing windows need separate native adaptation. Email reset links finish on the existing secure website. WeChat identity/phone login is a separate integration.

Weather refreshes while visible every five minutes around sessions, hourly within 48 hours of an upcoming session, otherwise every three hours; manual refresh is available. No maintainer PC needs to remain running. Background refresh is not promised.

See [TESTING.md](TESTING.md) for source checks, the maintainer's DevTools simulator results and the remaining device acceptance list. Real-device authentication and platform review are still required before release. This project is not yet a published, searchable Mini Program.
