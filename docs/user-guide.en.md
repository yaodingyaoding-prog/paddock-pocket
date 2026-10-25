# Paddock Pocket user guide

[简体中文](user-guide.md) · [English](user-guide.en.md)

## User guide

The application interface is primarily Chinese. The labels below include their on-screen names to help you navigate.

### 1. Guest browsing and accounts

Visit [F1.xiaodinglab.com](https://F1.xiaodinglab.com/) to browse race content without an account. To personalize your account avatar, select Create account (创建账号), and enter a nickname, your own email address and a password of at least six characters. The current production site signs new users in without a signup confirmation email.

You can enable Keep me signed in (保持登录). To recover a password, select Forgot password (忘记密码), enter your registered email, open the email link, confirm the recovery action and set a new password. Then sign in again. Use an address whose inbox you can access.

Self-hosted deployments can enable Supabase signup email confirmation. The application supports both confirmation-required and immediate signup flows.

### 2. Plan a race weekend

Open Schedule (赛程) and choose a season and Grand Prix to see practice, qualifying, sprint and race sessions. Drag the home-page circuit to rotate it, use the view control to reset it, or open the circuit profile for more details. Published sessions can have results, and schedules can be exported to a calendar.

Set your time zone in Profile (我的). Schedule times use that preference. Weather uses the circuit location and each session's time. Sessions outside the forecast range are labelled; historical races are not presented as future forecasts.

### 3. Explore standings and follow drivers

Open Standings (积分), then use the button beneath the table to expand it. Select a driver row for profile, career and news sections. The car number follows the selected season.

In Profile, choose up to three drivers for your personal podium and follow teams separately. Select the licence-card avatar to upload an image, drag and zoom the crop, and save it. Saved avatars follow your account across devices.

Nicknames, avatars, themes, accents, time zones and followed drivers or teams sync across devices through the account. Changes save automatically and Profile shows their status, with retry on failure. A signed-in device loads cloud settings and checks for updates every 30 seconds while visible, as well as on return to the page. Signing out opens the login page and clears the guest podium; signing in restores cloud settings. Clearing browser data does not delete confirmed cloud settings. The first upgraded device migrates legacy preferences only when no cloud record exists. Guest choices are previews for the current page only.

### 4. Watch live coverage and find replays

Open Discover → Viewing center (探索 → 观赛中心). Choose Five Star Sports or Tencent Video. Tencent has separate web and app buttons. App links require the corresponding app and depend on browser support.

The Five Star Sports setup panel detects your device and also allows manual selection:

| Device | Setup |
| --- | --- |
| Desktop | Install a script manager in a supported browser, import the desktop script and open Kankanews in that browser |
| iPhone / iPad | Enable Userscripts in Safari, place both the iOS main script and request helper in its chosen directory, and grant website access as instructed |
| Android browser | Use a browser that supports a script manager and import the Android script; the ZIP is a script distribution archive, not an APK |
| Paddock Pocket Android app | Use the viewing entry to open the separate viewing window; playback still depends on the program, network and upstream platform |

The website cannot automatically install extensions or inject scripts into a third-party cross-origin player. Follow the in-app instructions and [script provenance notes](../public/user-scripts/SOURCE.md).

Open Discover → Race replays (探索 → 赛事回放), select a season and session type, search for a Grand Prix, then choose Bilibili or Tencent Video. These buttons generate keyword searches rather than individually verified video links. A complete replay may be unavailable. Videos are hosted by the respective platforms and may require an account, subscription or regional access.

### 5. Use the analysis tools

In Discover → Telemetry (探索 → 遥测分析), select a session with published data and two drivers. Compare recorded speed, throttle and related channels, and inspect tyres, pit stops and race-control messages. Coverage depends on upstream publication; missing records are not replaced with simulated readings.

In Standings → Championship conditions (积分 → 夺冠条件), choose a driver and assumed race and sprint positions to calculate the rival conditions needed to clinch at the next round. The calculator currently uses the 2026 full-points configuration. It evaluates points scenarios, not title probabilities. Started sessions, incomplete inputs and unresolved countback cases retain explicit warnings. Cancellations, shortened races and penalties require recalculation and review.

## Platforms and updates

| Platform | Access | Updates and limitations |
| --- | --- | --- |
| Mobile, tablet and desktop browsers | Visit the live website | Reload to receive the latest deployed pages; internet access is required |
| iPhone / iPad home screen | Safari → Share → Add to Home Screen | A web shortcut, without native iOS or Apple Watch widgets |
| Android 8.0 or later | Install the 1.0.3 APK | Main pages follow production; native updates require a downloaded APK and user-confirmed installation |
| Android home-screen widget | Add it through the launcher's widget picker after installing the app | Next-session countdown, weather and up to three followed drivers; scheduling depends on power and network conditions |

Android 1.0.3 uses package `dev.paddock.pocket` and `versionCode=12`. It checks native versions while open and supports manual checks. It does not silently install updates or deliver background push updates. Users of 0.5.0 need a manual installation; 0.6.0 users can check for updates in the app. In-place updates require the same signing certificate.

The maintainer has completed real-device validation of Android 0.7.0 and confirmed that it works. The APK uses the project's preview certificate, with Java compilation, signing and ZIP alignment checked. See the [download metadata and SHA-256](../public/downloads/android-build.json) and [native sources and build requirements](../native/android).

A native Apple Watch app, watch-face complications and Smart Stack widgets are not currently available.

## Guest access and sharing

Race content is available without signing in. Use **Share weekend** on Schedule or the share icon on your podium to generate a PNG poster with a QR code. Race posters include the selected timezone and retrieval time; a matching race forecast is shown only when available in a valid weather cache. Use system sharing, save the image or copy the link. Shared lineups open as previews and do not overwrite the recipient’s follows. Account email, member ID and private avatars are excluded.
