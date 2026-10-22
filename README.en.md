# Paddock Pocket · 围场口袋

[简体中文](README.md) · [English](README.en.md)

**A race information and viewing companion for Formula 1 fans.**

Paddock Pocket brings schedules, standings, circuit weather, race analysis and viewing links into a connected race-weekend experience. The project develops and maintains its own product interface, application logic, device adaptations and deployment setup for phones, tablets and desktop browsers.

This repository contains the web application, server-side routes, public assets and Cloudflare Workers deployment configuration.

**Visit: [F1.xiaodinglab.com](https://F1.xiaodinglab.com/)** · **[Race replays](https://F1.xiaodinglab.com/#discover/replays)**

![Paddock Pocket race replay library](docs/images/race-replays.jpg)

## Our work

Paddock Pocket covers product design, interaction, engineering and delivery:

- **Product and interface:** reorganized the schedule, standings, viewing and discovery areas; designed secondary pages, responsive layouts, multiple themes and device preferences.
- **Race experience:** integrated weekend schedules, results, driver profiles and analysis tools; added historical driver portraits, 3D circuit views and championship points scenarios.
- **Weather and viewing:** connected weather to circuit locations and session times, with schedule-aware refresh intervals; built a replay library searchable by season, Grand Prix and session, alongside device-specific live-viewing guidance.
- **Data and performance:** implemented same-origin data routes, parameter validation, caching, timestamped snapshot fallbacks, a compact portrait index, locally hosted fonts and startup recovery prompts.
- **Deployment and maintenance:** deployed the application on an independent domain with Cloudflare Workers and maintained automated checks, production builds and asset provenance records.

## Features

| Area | Capabilities |
| --- | --- |
| Schedule and results | Season selection, Grand Prix weekends, session schedules, countdowns, results and calendar reminders |
| Standings | Driver and constructor standings, driver portraits, followed drivers and related news |
| Circuit profiles | Circuit information, 3D layouts and historical details |
| Circuit weather | Current conditions, session-time forecasts and hourly weather |
| Analysis | Two-driver telemetry comparisons, tyre strategy, technical information and championship points scenarios |
| Live viewing | Five Star Sports links, Tencent Video web and app options, and device-specific script installation guidance |
| Race replays | Bilibili and Tencent Video search links by season, Grand Prix and session, including races, qualifying, sprints and practice |
| Discover and settings | Curated news, classic races, an F1 encyclopedia, rules, color themes and time-zone preferences |

Replay entries search third-party platforms using race keywords; the project does not host race videos. News consists of curated Chinese-language briefs. Race, telemetry and technical coverage depends on data published by upstream services. The English README documents the project; it does not imply that the application interface is fully translated.

## Architecture

- **Interface:** React 19, TypeScript and responsive CSS.
- **Build and runtime:** Vite, Vinext and Cloudflare Workers.
- **3D circuits:** Three.js.
- **Data layer:** same-origin server routes, parameter validation, caching and timestamped snapshot fallbacks.
- **Continuous checks:** GitHub Actions runs type checks, functional validation and production builds.

```text
app/                   Pages, interface components and server-side API routes
lib/                   Race, weather, telemetry, replay and points logic
public/                Images, fonts, models, scripts and downloads
scripts/               Validation and asset-index generation scripts
docs/                  Project documentation and screenshots
.github/workflows/     Continuous integration configuration
worker.ts              Cloudflare Worker entry point
wrangler.jsonc         Worker, asset and domain configuration
```

## Local development

Use **Node.js 24** and npm. Dependency versions are pinned through `package-lock.json`.

```bash
npm ci
npm run dev
```

The development server runs at `http://127.0.0.1:5174` by default.

```bash
npm run check     # Type checks and functional validation
npm run build     # Production build
npm run preview   # Preview the built application
```

After updating portrait source records, run `node scripts/build-portrait-index.mjs` to regenerate the compact browser index, then run the checks. Full image provenance and copyright records remain in the repository.

## Deployment

The application requires server-side routes. Deploy the complete build to **Cloudflare Workers**.

| Setting | Current value |
| --- | --- |
| Worker name | `paddock-pocket`, matching `wrangler.jsonc` |
| Production branch | `main` |
| Repository root directory | `/` |
| Node.js | `24` |
| Build command | `npm run check && npm run build` |
| Deploy command | `npm run deploy` |

Connect Cloudflare's Git integration to the repository using these settings. Verify the build record and live application after deployment. If a push does not trigger a build, use **Retry build** on the Cloudflare build details page.

For local deployment, authenticate with your own Cloudflare account and adjust the Worker name and domains in `wrangler.jsonc` for your deployment target:

```bash
npx wrangler login
npm run check
npm run build
npm run deploy
```

The public address is displayed as `F1.xiaodinglab.com`. Domain names are case-insensitive, so browsers may normalize it to `f1.xiaodinglab.com`. The root domain, `xiaodinglab.com`, remains available for compatibility.

## Platform and data notes

- The web application supports phones, tablets and desktop browsers. On iPhone and iPad, it can be added to the Home Screen through Safari.
- The Android APK is a preview release with a separately maintained native project. This repository focuses on the web application and its server deployment.
- A native Apple Watch application, watch-face complications and Smart Stack widgets are not yet available.
- When a race-data request fails, the interface displays an available cache or snapshot with its timestamp. Historical snapshots are not labeled as live data.
- Weather refreshes while the page is in the foreground and online, with more frequent updates around sessions and lower frequency outside those periods.
- Preferences are stored in the current device's browser. Once deployed, the website does not require the maintainer's computer to stay on.

## Acknowledgments and sources

We thank the following projects and resource maintainers:

- **[F1Push（发车格）](https://f1push.com/):** a reference for race information organization and selected interactions. The current application also uses its services for some race, standings, telemetry and technical data. Paddock Pocket maintains the integration, validation, caching and presentation layer. See [`app/api/data/route.ts`](app/api/data/route.ts) and [`lib/tool-data.ts`](lib/tool-data.ts).
- **[Popukok/smg_live](https://github.com/Popukok/smg_live):** the upstream project for the Five Star Sports viewing-assistance scripts. Paddock Pocket distributes maintainer-supplied optimized adaptations and installation guidance for desktop, iPhone / iPad and Android. The scripts use the MIT license and retain `Copyright (c) 2025 _xFox`. See the [script license](public/user-scripts/LICENSE), [Android license](public/user-scripts/ANDROID-LICENSE) and [version and checksum records](public/user-scripts/SOURCE.md).

Bundled SMG versions are desktop `0.24`, iOS / iPadOS main script and request helper `0.24.1`, and Android `0.25.0`; these may differ from the latest upstream release. The scripts modify playback requests, program fields and player-source handling. Browser use requires a user-installed and authorized script manager. The website does not automatically install extensions or inject scripts into third-party embedded pages.

| Source | Purpose | Attribution and license records |
| --- | --- | --- |
| [Open-Meteo](https://open-meteo.com/) | Current conditions and forecasts near circuits | Source, CC BY 4.0 attribution and retrieval times are retained in the interface |
| Formula 1 website and historical image sources | Driver portraits | [Current drivers](public/drivers/credits.json) · [Historical drivers](public/drivers/history/credits.json) |
| [bacinger/f1-circuits](https://github.com/bacinger/f1-circuits) | Circuit coordinates and base data for 3D models | [Model sources, modifications and MIT license](public/circuits/models/credits.json) |
| Barlow Project / Google Fonts | Barlow Condensed fonts | [SIL Open Font License 1.1](public/fonts/OFL-Barlow-Condensed.txt) · [Font sources](public/fonts/sources.json) |

## Licensing

No repository-wide open-source license has been assigned to the project's own code. Third-party scripts, images, fonts, circuit data and other assets remain subject to their respective licenses and provenance records.

Paddock Pocket is independently developed and maintained by the project maintainers. It is not officially affiliated with or endorsed by Formula 1, F1Push or the viewing platforms. Referencing a product or integrating a service does not grant a blanket open-source license to its code, data or assets.
