# Paddock Pocket · 围场口袋

### Your F1 weekend, in your pocket.

Paddock Pocket brings race schedules, standings, circuit weather, driver profiles, viewing links and analysis into one application. Browse races immediately, then sign in for a personal fan pass, a three-driver podium and settings that follow your account across devices.

[Live application](https://F1.xiaodinglab.com/) · [Download Android 1.0.3](https://f1.xiaodinglab.com/download) · [User guide](docs/user-guide.en.md) · [简体中文](README.md)

[![Project checks](https://github.com/yaodingyaoding-prog/paddock-pocket/actions/workflows/check.yml/badge.svg)](https://github.com/yaodingyaoding-prog/paddock-pocket/actions/workflows/check.yml) [![Android](https://img.shields.io/badge/Android-8.0%2B-3DDC84?logo=android&logoColor=white)](https://f1.xiaodinglab.com/download) [![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

![Paddock Pocket: schedules, weather and replays](public/social-cover.png)

## Designed around race weekends

When does the next session start? Will it rain at the circuit? How close are the championship standings? Where can you catch a race you missed? Paddock Pocket organizes these tasks into four main destinations: Schedule, Standings, Discover and Profile.

The project designs and implements its own product interface, interactive 3D circuits, glass navigation and page motion, personal podium, account and avatar system, cloud preference sync, race-data integration and validation, Android application and home-screen widget. It also maintains the build, testing and deployment workflow.

### A weekend view from the moment you open it

The next Grand Prix, session countdown, timetable and tyre information appear together. Rotate the 3D circuit directly on the home page, zoom in or reset the view. Open the circuit archive for layouts, specifications and historical information.

Switch seasons and rounds, view session results, choose your display time zone and add races to your calendar. Plan viewing in your own time zone or follow the weekend in circuit-local time.

### Weather matched to the circuit and session

Weather uses circuit coordinates and offers both current local conditions and session forecasts. Select practice, qualifying or the race to inspect conditions, precipitation, wind and hourly changes around that session. Update frequency increases around race sessions.

### Standings with the people behind the points

Standings show the top five first and expand to the full field. Open a driver profile for season-specific car numbers and teams, career results, championship years, team history and related news. Separate driver and constructor standings support both a quick points check and a closer look at the season.

### Your lineup on every device

Choose up to three favorite drivers for your personal podium and follow teams separately. A super-licence-inspired fan pass combines your nickname with a custom avatar. Upload an image, then drag, zoom and crop it before saving.

Nicknames, avatars, driver and team follows, theme, accent and time zone sync through your account. Pick a lineup on your phone and find it again on your tablet or computer. Profile shows save status, and preference changes save automatically.

### Viewing, replays and race analysis

The viewing centre combines Five Star Sports setup instructions with Tencent Video web and app entry points. Replay tools generate Bilibili and Tencent Video searches by season, Grand Prix and session.

Discover also includes paddock news, classic races, an F1 encyclopedia, rules and technical material. Telemetry tools compare two drivers and present tyre records, pit stops and race-control messages. Championship-condition tools calculate the rival results needed to clinch at the next round under selected finishing scenarios.

### Make the paddock your own

Choose from 10 interface themes, 12 accent colors and searchable time zones. Glass navigation, distinct transitions and a continuously animated F1 login scene carry the design across phones, tablets and desktops. Motion also respects the system's reduced-motion preference.

Share a weekend or your podium as a PNG poster with a QR code. Use system sharing, save an image or copy a link. Friends can preview your lineup while keeping their own follows separate.

<details>
<summary>View the application</summary>

![Paddock Pocket Discover screen](docs/images/discover.jpg)

</details>

## Start using it

1. Open [F1.xiaodinglab.com](https://F1.xiaodinglab.com/) to browse schedules, standings, weather, driver profiles and replay links as a guest.
2. In Schedule (赛程), choose a season and Grand Prix. Check session times, forecasts and circuit information, or use a calendar button to save your viewing schedule.
3. In Standings (积分), expand the full table, open driver profiles and use the heart buttons to follow drivers or teams.
4. Register or sign in. In Profile (我的), set an avatar, choose your podium, theme, accent and time zone. Once the sync confirmation appears, sign in to the same account on another device to continue with those settings.
5. In Discover → Viewing centre (探索 → 观赛中心), choose a viewing platform. For past sessions, open Replays (赛事回放) and search by season, round and session. Five Star Sports instructions provide the relevant steps for your device.
6. Use Share weekend or the podium share button to send race plans and your lineup to friends.

For password recovery, choose Forgot password on the login page and follow the email verification flow. See the [English user guide](docs/user-guide.en.md) for detailed instructions.

## Phones, tablets and Android

| Platform | Access | Experience |
| --- | --- | --- |
| Phone, tablet and desktop browsers | [Open the website](https://F1.xiaodinglab.com/) | Responsive interface and account settings across devices |
| iPhone / iPad | Safari → Share → Add to Home Screen | Quick access from your home screen |
| Android 8.0 or later | [Download the 1.0.3 APK](https://f1.xiaodinglab.com/download) | The production interface, Android system integration and a home-screen widget |

**The maintainer has completed real-device validation of Android 0.7.0 and confirmed that it works.**

Download the APK and follow Android's installation prompts. The application provides system image picking, calendar saving, a viewing window, platform app launch and version checks. After installation, add Paddock Pocket from your launcher's widget picker to see the next-session countdown, weather and followed drivers on the home screen.

Reloading the app receives deployed web-interface updates. Native updates arrive through a new APK. Version 1.0.3 retains package `dev.paddock.pocket` and the same signing certificate as 0.6.0 for in-place upgrades.

[Android release notes](docs/android-release.md) · [Checksums and version metadata](public/downloads/android-build.json) · [Changelog](CHANGELOG.md)

## Local development

Use **Node.js 24** and npm:

```bash
git clone https://github.com/yaodingyaoding-prog/paddock-pocket.git
cd paddock-pocket
npm ci
npm run dev
```

Open `http://127.0.0.1:5174`. Start developing the race interface directly; configure your own Supabase project for accounts, avatars and cloud settings.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run check` | Run type and feature checks |
| `npm run build` | Create the production build |
| `npm run preview` | Preview an existing build |
| `npm run deploy` | Deploy to Cloudflare Workers |

Checks cover authentication and account separation, preference sync, avatars, weather, telemetry, replays, championship conditions, motion, sharing and APK release integrity.

## WeChat Mini Program

A [native project and import guide](native/wechat/README.en.md) is available for individual accounts, sharing the existing race API and cloud preferences. AppID setup and actual WeChat acceptance testing are still required before publication.

## Self-hosting

1. Fork this repository. Change the Worker name in `wrangler.jsonc` and replace `routes` with your own domains.
2. Create a Supabase project and configure Email login, SMTP and the `/auth/confirm` callback. The hosted application uses Resend for account email.
3. Copy `.env.example` to `.dev.vars` for local configuration. Add production variables and Secrets in Cloudflare.
4. Run the [avatar storage SQL](docs/avatar-storage.sql) and [account preferences SQL](docs/account-preferences.sql) once in Supabase to configure private avatars and owner-only preference access.
5. Run checks and the production build, then deploy the Worker together with its static assets.

For Cloudflare Git builds, use Node.js `24`, build command `npm run check && npm run build` and deploy command `npm run deploy`.

| Variable | Purpose |
| --- | --- |
| `AUTH_MODE` | `off` for local development; `required` for account and private-route protection |
| `AUTH_BASE_URL` | Application origin; use HTTPS in production |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | Project Publishable key |
| `AUTH_SESSION_SECRET` | At least 32 random characters for temporary recovery authorization |

Keep environment files and signing keys in your own deployment environment. Detailed notes cover [accounts](docs/authentication-setup.md), [avatars and driver profiles](docs/profile-features.md), [cloud preference sync](docs/account-preferences.md) and [Android builds](native/android/README.md).

## Technology and project layout

React 19 and TypeScript provide the interface. Vite / Vinext and Cloudflare Workers run pages and server endpoints, while Three.js renders interactive circuits. Supabase Auth, Storage and PostgreSQL handle authentication, private avatars and preference sync. Android uses Java, WebView and AppWidget.

```text
app/                   Pages, interactions and API routes
lib/                   Race, weather, telemetry, accounts and sync logic
native/android/        Android app, widget and build scripts
native/wechat/         Native WeChat project for individual accounts
public/                Images, fonts, models, scripts and APKs
scripts/               Validation, indexing and APK publication
docs/                  User, configuration and release guides
```

## Participate

Share ideas, [report an issue](https://github.com/yaodingyaoding-prog/paddock-pocket/issues) or submit a pull request. For data questions, include the season, round, session and driver. For interface issues, provide the OS, browser and reproduction steps. Run `npm run check` and `npm run build` before submitting changes.

[Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Changelog](CHANGELOG.md) · [Sharing resources](docs/guest-sharing-launch.md)

If you enjoy Paddock Pocket, give it a Star and share it with the people you watch races with.

## Acknowledgments and license

Thanks to [F1Push（发车格）](https://f1push.com/) for references in information organization and selected interactions, and for some race-data services; and to [Popukok/smg_live](https://github.com/Popukok/smg_live) for the upstream Five Star Sports viewing-assistance scripts. This project maintains its own product implementation, device adaptations, viewing setup and integration, with upstream attribution and licenses retained.

Weather uses Open-Meteo. Sources and permissions for images, circuit data, fonts, scripts and dependencies are recorded in [third-party notices](THIRD_PARTY_NOTICES.md). Original project code and documentation use the [MIT License](LICENSE), `Copyright (c) 2026 yaodingyaoding-prog`. Third-party content retains its respective rights.

Paddock Pocket is an independent fan project, without official affiliation or endorsement from Formula 1, F1Push, Five Star Sports or the viewing platforms.
