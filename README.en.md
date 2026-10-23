# Paddock Pocket · 围场口袋

### Every race weekend starts here.

A race and viewing companion for Formula 1 fans. Plan a weekend, check standings and circuit weather, compare telemetry, find live coverage and replays, and give your favorite drivers a place on your personal podium.

[Live application](https://F1.xiaodinglab.com/) · [Android 0.6.0 preview](https://f1.xiaodinglab.com/downloads/Paddock-Pocket-0.6.0.apk) · [简体中文](README.md) · [Report an issue](https://github.com/yaodingyaoding-prog/paddock-pocket/issues)

![Project checks](https://github.com/yaodingyaoding-prog/paddock-pocket/actions/workflows/check.yml/badge.svg)

![Paddock Pocket Discover page](docs/images/discover.jpg)

<details>
<summary>View the login screen</summary>

![Paddock Pocket login](docs/images/login.jpg)

</details>

## What makes it useful

Paddock Pocket organizes the experience around four main destinations: Schedule, Standings, Discover and Profile. Telemetry, technical information and replays have their own detail pages. Phones, tablets and desktops use the same application.

- Rotate the 3D circuit directly on the home page, alongside the next-session countdown and weekend schedule.
- Scan the top five drivers or expand the full standings. Open a driver to see the selected season's number, career results, title years, team history and news.
- Read weather matched to circuit coordinates and session times, with more frequent checks around racing sessions.
- Customize a fan licence card with a cropped account avatar, a three-driver podium and separate team follows.
- Combine 10 interface themes with 12 accent colors, and choose a searchable IANA time zone with daylight-saving handling.
- Use floating glass navigation, page transitions and a continuously animated circuit login screen, with reduced-motion support.
- Receive web interface updates in the Android online app through the same production website.

The project develops and maintains its interface, navigation, weather and account services, data integration and validation, cache fallbacks, device adaptations and deployment workflow. Upstream dependencies are documented under [Acknowledgments and sources](#acknowledgments-and-sources).

## Features

| Area | Available capabilities |
| --- | --- |
| Race weekends | Seasons, Grand Prix schedules, session countdowns, results and calendar exports |
| Standings and drivers | Driver and constructor standings, expandable tables, current and historical portraits, profiles and career records |
| Circuits | Interactive 3D home-page outlines, circuit profiles, layouts and historical information |
| Weather | Current conditions, hourly forecasts, session-time forecasts and retrieval timestamps |
| Analysis | Two-driver telemetry, tyres and pit stops, race-control messages, technical information and championship clinching conditions |
| Viewing | Five Star Sports, Tencent Video web and app options, and device-specific setup instructions |
| Replays | Bilibili and Tencent searches by season, Grand Prix and race / qualifying / sprint / practice |
| Discover | Curated paddock news briefs, classic races, an F1 encyclopedia and rules |
| Profile | Account avatars, fan licence card, up to three followed drivers, team follows, themes and time zones |
| Accounts | Email/password registration and login, persistent sessions, email password recovery, logout and private avatar storage |
| Android | Online WebView application, a home-screen widget and APK update checks |

## User guide

The application interface is primarily Chinese. The labels below include their on-screen names to help you navigate.

### 1. Create an account

Visit [F1.xiaodinglab.com](https://F1.xiaodinglab.com/), select Create account (创建账号), and enter a nickname, your own email address and a password of at least six characters. The current production site signs new users in without a signup confirmation email.

You can enable Keep me signed in (保持登录). To recover a password, select Forgot password (忘记密码), enter your registered email, open the email link, confirm the recovery action and set a new password. Then sign in again. Use an address whose inbox you can access.

Self-hosted deployments can enable Supabase signup email confirmation. The application supports both confirmation-required and immediate signup flows.

### 2. Plan a race weekend

Open Schedule (赛程) and choose a season and Grand Prix to see practice, qualifying, sprint and race sessions. Drag the home-page circuit to rotate it, use the view control to reset it, or open the circuit profile for more details. Published sessions can have results, and schedules can be exported to a calendar.

Set your time zone in Profile (我的). Schedule times use that preference. Weather uses the circuit location and each session's time. Sessions outside the forecast range are labelled; historical races are not presented as future forecasts.

### 3. Explore standings and follow drivers

Open Standings (积分), then use the button beneath the table to expand it. Select a driver row for profile, career and news sections. The car number follows the selected season.

In Profile, choose up to three drivers for your personal podium and follow teams separately. Select the licence-card avatar to upload an image, drag and zoom the crop, and save it. Saved avatars follow your account across devices.

Themes, accents, time zones and followed drivers or teams remain local to the current device. These preferences do not currently sync through the account; avatars do.

### 4. Watch live coverage and find replays

Open Discover → Viewing center (探索 → 观赛中心). Choose Five Star Sports or Tencent Video. Tencent has separate web and app buttons. App links require the corresponding app and depend on browser support.

The Five Star Sports setup panel detects your device and also allows manual selection:

| Device | Setup |
| --- | --- |
| Desktop | Install a script manager in a supported browser, import the desktop script and open Kankanews in that browser |
| iPhone / iPad | Enable Userscripts in Safari, place both the iOS main script and request helper in its chosen directory, and grant website access as instructed |
| Android browser | Use a browser that supports a script manager and import the Android script; the ZIP is a script distribution archive, not an APK |
| Paddock Pocket Android app | Use the viewing entry to open the separate viewing window; playback still depends on the program, network and upstream platform |

The website cannot automatically install extensions or inject scripts into a third-party cross-origin player. Follow the in-app instructions and [script provenance notes](public/user-scripts/SOURCE.md).

Open Discover → Race replays (探索 → 赛事回放), select a season and session type, search for a Grand Prix, then choose Bilibili or Tencent Video. These buttons generate keyword searches rather than individually verified video links. A complete replay may be unavailable. Videos are hosted by the respective platforms and may require an account, subscription or regional access.

### 5. Use the analysis tools

In Discover → Telemetry (探索 → 遥测分析), select a session with published data and two drivers. Compare recorded speed, throttle and related channels, and inspect tyres, pit stops and race-control messages. Coverage depends on upstream publication; missing records are not replaced with simulated readings.

In Standings → Championship conditions (积分 → 夺冠条件), choose a driver and assumed race and sprint positions to calculate the rival conditions needed to clinch at the next round. The calculator currently uses the 2026 full-points configuration. It evaluates points scenarios, not title probabilities. Started sessions, incomplete inputs and unresolved countback cases retain explicit warnings. Cancellations, shortened races and penalties require recalculation and review.

## Platforms and updates

| Platform | Access | Updates and limitations |
| --- | --- | --- |
| Mobile, tablet and desktop browsers | Visit the live website | Reload to receive the latest deployed pages; internet access is required |
| iPhone / iPad home screen | Safari → Share → Add to Home Screen | A web shortcut, without native iOS or Apple Watch widgets |
| Android 8.0 or later | Install the 0.6.0 preview APK | Main pages follow production; native updates require a downloaded APK and user-confirmed installation |
| Android home-screen widget | Add it through the launcher's widget picker after installing the app | Next-session countdown, weather and up to three followed drivers; scheduling depends on power and network conditions |

Android 0.6.0 uses package `dev.paddock.pocket` and `versionCode=6`. It checks native versions while open and supports manual checks. It does not silently install updates or deliver background push updates. Users of 0.5.0 need one manual upgrade to 0.6.0. In-place updates require the same signing certificate.

The APK uses a preview certificate. Java compilation, signing and ZIP alignment have been checked. Login, image picking, playback, update prompts and launcher-specific widgets still require Android device acceptance. See the [download metadata and SHA-256](public/downloads/android-build.json) and [native sources and build requirements](native/android).

A native Apple Watch app, watch-face complications and Smart Stack widgets are not currently available.

## Run locally

Use **Node.js 24**, matching `.node-version` and CI, and install the locked dependencies with npm.

```bash
git clone https://github.com/yaodingyaoding-prog/paddock-pocket.git
cd paddock-pocket
npm ci
npm run dev
```

Open `http://127.0.0.1:5174`. Without account configuration, `AUTH_MODE` defaults to `off`, allowing development of the main race interface. Registration, avatars and other account features require the setup below. Race and weather requests still need access to upstream services.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start development on port 5174 |
| `npm run check` | Type checks and validation for accounts, weather, replays, telemetry, championship conditions and other features |
| `npm run build` | Create a production build |
| `npm run preview` | Preview an existing build on port 5174 |
| `npm run deploy` | Deploy the build to Cloudflare Workers |

Build before running `preview`. A `127.0.0.1` address is accessible only on the computer running the server.

### Configure accounts, email and avatars

Copy `.env.example` to `.dev.vars` and enter your own settings. Use your own Supabase project and sending domain.

```dotenv
AUTH_MODE=required
AUTH_BASE_URL=http://127.0.0.1:5174
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
AUTH_SESSION_SECRET=YOUR_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
```

These are placeholders:

| Variable | Requirement |
| --- | --- |
| `AUTH_MODE` | `off` disables mandatory login; `required` protects the app and business endpoints |
| `AUTH_BASE_URL` | Application origin without a trailing slash; use your own HTTPS domain in production |
| `SUPABASE_URL` | Your Supabase Project URL |
| `SUPABASE_PUBLISHABLE_KEY` | A Publishable key starting with `sb_publishable_`; no administrative key is needed |
| `AUTH_SESSION_SECRET` | An independently generated secret of at least 32 random characters for temporary password-recovery grants |

Create a Supabase project, enable Email login and signup, and configure the Site URL and `/auth/confirm` redirect. To match the current live site, disable signup Confirm email and set the password minimum to six characters. Password recovery still requires email verification. If you enable Confirm email instead, configure the signup confirmation template too.

Configure password-recovery email through Resend or another SMTP provider supported by Supabase. A Resend API key belongs in Supabase's SMTP Password field, not in frontend code or Git. For avatars, review and run [`docs/avatar-storage.sql`](docs/avatar-storage.sql) once in your own project. It creates a private bucket and owner-path access policies.

The [account setup guide](docs/authentication-setup.md) and [avatar guide](docs/profile-features.md) contain further details in Chinese. Restart local development after changing configuration. Store production secrets in Cloudflare runtime Secrets. Do not commit or publicly distribute `.dev.vars`, real `.env` files or local build output.

## Deploy to Cloudflare Workers

The application needs server routes alongside its static assets. A static-only deployment cannot serve accounts, weather or data endpoints.

1. Fork the repository or copy it to a repository you own.
2. Change the Worker `name` in `wrangler.jsonc`. Remove the existing site domains from `routes`, or replace them with domains you own. Keep `workers_dev=true` if you want a Workers test address initially.
3. Connect your repository through Cloudflare Workers' Git integration using the settings below.
4. Configure production runtime variables and Secrets, and add the production callback URL to Supabase.
5. Verify signup, login, password recovery, avatars, anonymous endpoint protection and main pages before opening access to users.

| Setting | Value |
| --- | --- |
| Node.js | `24` |
| Repository root | `/` |
| Production branch | `main` |
| Build command | `npm run check && npm run build` |
| Deploy command | `npm run deploy` |

You can also authenticate with your own Cloudflare account and deploy locally:

```bash
npx wrangler login
npm run check
npm run build
npm run deploy
```

`wrangler.jsonc` declares authentication rate-limit bindings and uses `keep_vars=true` to retain dashboard variables. With `AUTH_MODE=required`, missing configuration or an account-service failure does not restore anonymous access.

You can start with the providers' free plans. Check Cloudflare, Supabase and Resend for current quotas, availability and inactivity policies. Domain registration is separate. Once deployed, requests run in the cloud; the maintainer's computer does not need to remain on.

### Build your own Android version

Sources are under [`native/android`](native/android). The current PowerShell build script requires a JDK, Android platform SDK, AAPT2, D8/R8, zipalign and apksigner. The directory README specifies the expected tool layout.

For a fork, update the native website and download URLs. Before distributing your own application, also configure its package identity, versions and signing setup. The current script uses preview signing, and the repository does not contain the maintainer's private signing files. Store publishing needs a separate release configuration.

## Architecture and repository layout

React 19, TypeScript and responsive CSS provide the interface. Vite / Vinext and Cloudflare Workers run server routes. Three.js renders circuit views, Supabase Auth / Storage provides accounts and avatars, and Resend delivers email through Supabase SMTP.

```text
app/                   Pages, interactions and API routes
lib/                   Race, weather, telemetry, account, replay and points logic
components/            Shared interface components
public/                Images, models, fonts, scripts and APK downloads
native/android/        Android application, widget and build script
scripts/               Type and feature validation, portrait index generation
docs/                  Setup, feature notes, SQL and screenshots
.github/workflows/     GitHub Actions checks and builds
worker.ts              Worker entry point
wrangler.jsonc         Deployment, domains, assets and rate-limit bindings
```

After editing portrait provenance, run `node scripts/build-portrait-index.mjs` to update the browser index and retain attribution records. CI runs `npm ci`, `npm run check` and `npm run build`.

## Data behavior and current limits

- Race, standings, driver, telemetry and some technical information depends on F1Push services. Retrieval timestamps indicate when this application fetched data, without guaranteeing live-timing latency. Snapshot fallbacks apply only where a matching snapshot exists and retain their timestamps.
- Open-Meteo supplies weather. With the page visible and online, checks run about every five minutes from 30 minutes before a session until 30 minutes after it ends, hourly when a session is within the next 48 hours, and every three hours otherwise. Server caching also applies. Failures may show explicitly labelled stale data up to six hours old. A closed webpage does not keep polling.
- News consists of attributed Chinese editorial briefs, rather than continuous full-article ingestion from every platform. Classic races are editorial selections, not a user-voted ranking.
- Some historical portraits and profiles may be missing. Special liveries and race suits depend on matching official announcements and are not guaranteed for every team or race.
- The application interface is primarily Chinese. This English README does not imply complete interface localization.
- Apple Sports data, championship probability models, a native iOS application and watchOS widgets are not currently integrated.

## Contributing and feedback

Use [Issues](https://github.com/yaodingyaoding-prog/paddock-pocket/issues) for bugs and suggestions. Include the page, reproduction steps, browser / OS version and screenshots with personal information removed. For data issues, specify the season, Grand Prix, session or driver.

Run `npm run check` and `npm run build` before submitting changes. Include provenance and licensing records when changing images, models, scripts or data sources. Keep passwords, cookies, verification links, keys and private account information out of issues, commits and screenshots.

If the project helps you enjoy a race weekend, consider giving it a [Star on GitHub](https://github.com/yaodingyaoding-prog/paddock-pocket).

## Acknowledgments and sources

Thank you to the developers and maintainers behind these references, services and resources:

| Project or resource | Use in Paddock Pocket | Records |
| --- | --- | --- |
| [F1Push · 发车格](https://f1push.com/) | Reference for race information organization and selected interactions; upstream for some race, standings, driver, telemetry and technical data | [Race integration](app/api/data/route.ts), [tools](lib/tool-data.ts), [drivers](lib/drivers/DriverRepository.ts) |
| [Popukok/smg_live](https://github.com/Popukok/smg_live) | Upstream Five Star Sports viewing-assistance scripts, distributed here with maintainer-supplied device adaptations and setup guidance | [Sources and SHA-256](public/user-scripts/SOURCE.md), [MIT license](public/user-scripts/LICENSE), [Android license](public/user-scripts/ANDROID-LICENSE) |
| [Open-Meteo](https://open-meteo.com/) | Current conditions and forecasts near circuits | Source, CC BY 4.0 attribution and retrieval times are retained in the interface |
| Formula 1 website and historical image sources | Driver portraits and selected race imagery | [Current portraits](public/drivers/credits.json), [historical portraits](public/drivers/history/credits.json), [imagery notes](docs/profile-features.md) |
| [bacinger/f1-circuits](https://github.com/bacinger/f1-circuits) | Circuit coordinates and base data for 3D models | [Sources and modifications](public/circuits/models/credits.json), [MIT license](public/circuits/models/LICENSE.txt) |
| Barlow Project / Google Fonts | Locally hosted Barlow Condensed fonts | [Sources](public/fonts/sources.json), [SIL OFL 1.1](public/fonts/OFL-Barlow-Condensed.txt) |

Bundled SMG versions are desktop `0.24`, iOS / iPadOS main script and request helper `0.24.1`, and Android `0.25.0`. They retain `Copyright (c) 2025 _xFox` and may differ from the latest upstream versions. The scripts handle playback requests, program fields and player-source changes; their provenance document describes behavior and verification records.

## Licensing and project identity

The repository is being prepared for public release. The project's own code does not yet have a repository-wide open-source license. Publishing source and granting an open-source license are separate steps; the root `LICENSE` file will define that scope once selected.

Third-party scripts, fonts, models, data, images and trademarks retain their respective licenses or rights notices. Publishing this repository does not make them original project work or grant blanket rights to reuse them. Image attribution records do not constitute an open license for those images.

Paddock Pocket is an independent fan project. It is not officially affiliated with or endorsed by Formula 1, F1Push, Five Star Sports or the viewing platforms.
