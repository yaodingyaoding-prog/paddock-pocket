# Product refinement and Android 0.6.0

Verified on 22 October 2026 (Asia/Shanghai).

## Interface and performance

The native page transition previously disabled the CSS entrance only while `data-page-transition=active`. Removing that attribute at completion restored the entrance animation, causing a second movement. The motion engine is now a persistent attribute, so completing a snapshot does not restart the live page. Full-page blur and duplicate native-mode row entrances were removed. The 3D scene renders only when its camera, dimensions or appearance change.

Circuit reset and enlargement are adjacent, translucent, icon-only circular controls. Login and registration replace the circuit drawing with an original decorative single-seater, flowing light fields and a starting-light sequence. There is no pause button. System reduced-motion preferences still take precedence.

Appearance includes 10 backgrounds and 12 accent choices. New light backgrounds have separate readable accent values. Discover includes a race-car illustration; driver biographies do not regain the removed car-photo section. The profile footer links to the project's GitHub repository; that link does not automatically star or change repository visibility.

## Registration and recovery

The repository accepts the normal session returned by Supabase auto-confirm signup. The service returns a safe app route and keeps its protected cookie session. Providers that still require email confirmation retain the email flow. No administrative signup API or provider secrets are introduced.

Disabling **Confirm email** is a separate provider setting, requiring the owner's confirmation. The implementation alone does not change it. Recovery continues to send email, validate the token server-side, issue a short recovery grant and require that grant before updating the password. The account card says ACTIVE rather than implying that an email was manually verified.

Backend feasibility: architectural fit 5, testability 5, complexity 1, data risk 2, operational risk 3: BFRI 4. Existing origin validation, rate limits, private avatar ownership and recovery grants remain covered by regression checks. Added fixtures exercise instant signup through both the service and official SDK cookie adapter.

## Android delivery and updates

0.5.0 bundled the older `iphone-web` directory. **0.6.0, versionCode 6**, loads `https://f1.xiaodinglab.com` in the app, so it uses the current login, UI and service routes. It needs an internet connection. Native capabilities are limited to trusted main-frame, user-initiated actions: widget pinning, the existing isolated viewing window, Tencent launch and update checks. There is no JavaScript interface exposing credentials. Avatar selection uses the system image document picker.

The app checks the fixed same-origin version manifest while open and provides a manual check. A larger versionCode offers a fixed-origin APK download; installation remains a user-confirmed Android action. This is not background push delivery or silent installation. The 0.5.0 app lacks this mechanism and needs one manual upgrade. Preserving the package identifier, increasing versionCode and retaining the signing certificate permits updates; the current certificate remains a preview/test certificate.

Java compilation, APK signature v2/v3, ZIP alignment and metadata passed. The SHA-256 and byte count are published in `/downloads/android-build.json`. No Android device was available for this release: login, camera/gallery picking, video playback, update prompts and launcher-specific widget behavior require device acceptance.

## Widgets

Android retains an actual AppWidget with the next session countdown, weather and up to three followed drivers. Follow choices are copied to native preferences when the app backgrounds; the widget requests data using the existing repository. The system schedules periodic updates around a 30-minute interval and may defer them for power/network conditions. The countdown uses the native chronometer. It does not require the developer's computer to remain running.

iPhone/iPad widgets and Apple Watch Smart Stack/complications require native WidgetKit targets, signed builds and device testing. A web home-screen shortcut cannot install these. The next implementation should share a small race/standings/weather DTO, precompute countdown timelines, and use a signed iOS/watchOS companion rather than embedding credentials in a webpage. Apple's refresh budget prevents promising continuous background live timing.

References: [Android signing](https://developer.android.com/studio/publish/app-signing), [Android widget updates](https://developer.android.com/develop/ui/views/appwidgets/advanced), [Apple WidgetKit strategy](https://developer.apple.com/documentation/widgetkit/developing-a-widgetkit-strategy), [WidgetKit refresh](https://developer.apple.com/documentation/widgetkit/keeping-a-widget-up-to-date), [Supabase confirmation settings](https://supabase.com/docs/guides/auth/general-configuration).

## Cache and rollback

Client cleanup only removes stale app data: race snapshots older than 24 hours, weather older than six hours, old weather cache versions and malformed entries. Preferences and sessions are preserved. Confirmed regenerable local build caches were removed. Old Android bundled resources were retained after automatic review rejected their deletion because they may still serve older builds.

Rollback: tag `backup/pre-refinement-20261022-7ba4bee`, previous production version `005821ec`. Source and Android backups are retained in the workspace backup directory.
