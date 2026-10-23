# Changelog

## 0.7.0 · 2026-10-23

- Rebuilt login, registration and recovery pages around an animated circuit, start lights, sector strips and a steady account form.
- Navigation commits immediately. Main destinations, details, return navigation, dialogs and standings expansion use distinct motion, with rapid-navigation cancellation and reduced-motion support.
- Updated Android to versionCode 7, retaining the existing package and preview signing identity for upgrades. The app loads the production website and includes a native home-screen widget.
- Android builds derive version information from the manifest. Custom signing reads passwords from named environment variables; build output stays in an ignored local directory by default.
- Added MIT licensing for original project code, third-party notices, bilingual documentation and release-integrity checks.
- Removed unused car artwork, obsolete native adapters and snapshots, superseded design notes, and the 0.5.0 APK. The preceding 0.6.0 APK remains available for recovery.

The published APK is a preview build. Java compilation, signature, ZIP alignment and metadata are verified. Android device acceptance remains pending.

## 0.6.0

- Moved Android to the production website so web interface updates also reach the installed app.
- Added APK update checks, image picking, calendar export and scoped native viewing / widget actions.
- Expanded themes and accent colors, improved profile and avatar features, and retained the Android home-screen widget.
