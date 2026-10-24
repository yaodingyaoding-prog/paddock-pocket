# Changelog

## Unreleased

- Login, registration and recovery forms now receive non-sensitive availability flags with their server-rendered page, avoiding a blocking lookup of old or expired sessions. Added a lightweight availability endpoint for reconnection checks.
- Separated account requests from the animated login screen module and added controlled messages for network timeouts and non-JSON gateway responses, preserving single-submit authentication behaviour.

## 0.7.1 · 2026-10-24

- Updated desktop, Android and iPhone/iPad viewing scripts to the maintainer-provided SMG 0.26.0 release, preserving original bytes, attribution and licenses.
- Updated device-specific installation guidance and added a complete three-platform download bundle with checksums.
- Bundled the exact Android 0.26.0 helper and MIT license in the APK. Mobile `/huikan/10` viewing links remain inside the isolated official-page player.
- Increased Android versionCode to 8 while retaining the existing package and signing certificate for in-place updates. Publication verifies the helper version and hash against the web release.

- Rewrote the Chinese and English READMEs around product features, viewing workflows, account sync and Android use. Updated Android 0.7.0 device-validation status following the maintainer's confirmation on 2026-10-24.
- Added account-based cross-device sync for driver/team follows, theme, accent and time zone, using owner-only Supabase RLS and atomic partial updates. Includes safe legacy migration, save status and retries, foreground refresh and pending-save handling before logout.
- Fixed login and registration from the legacy domain by canonicalizing document requests before forms render, preserving return links while keeping strict API origin checks.
- Fixed logout retaining stale account UI after hash navigation. Successful logout now clears account state, notifies other tabs and opens the login page.
- Separated on-device driver and team follows by account. Logout clears the guest podium and Android widget snapshot while retaining each account's own saved selection for its next login.
- Added guest access to race schedules, standings, weather, driver archives and replay tools while retaining private account and avatar authorization.
- Added local weekend and podium PNG share posters, QR codes and safe read-only lineup links.
- Added a public product introduction, Open Graph / Twitter cover, robots and sitemap metadata.

## 0.7.0 · 2026-10-23

- Rebuilt login, registration and recovery pages around an animated circuit, start lights, sector strips and a steady account form.
- Navigation commits immediately. Main destinations, details, return navigation, dialogs and standings expansion use distinct motion, with rapid-navigation cancellation and reduced-motion support.
- Updated Android to versionCode 7, retaining the existing package and preview signing identity for upgrades. The app loads the production website and includes a native home-screen widget.
- Android builds derive version information from the manifest. Custom signing reads passwords from named environment variables; build output stays in an ignored local directory by default.
- Added MIT licensing for original project code, third-party notices, bilingual documentation and release-integrity checks.
- Removed unused car artwork, obsolete native adapters and snapshots, superseded design notes, and the 0.5.0 APK. The preceding 0.6.0 APK remains available for recovery.

The published APK uses the project's preview certificate. Java compilation, signature, ZIP alignment and metadata are verified. The maintainer confirmed real-device validation on 2026-10-24.

## 0.6.0

- Moved Android to the production website so web interface updates also reach the installed app.
- Added APK update checks, image picking, calendar export and scoped native viewing / widget actions.
- Expanded themes and accent colors, improved profile and avatar features, and retained the Android home-screen widget.
