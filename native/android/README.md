# Android 0.7.0

[简体中文发布说明](../../docs/android-release.md) · [Download metadata](../../public/downloads/android-build.json)

The app loads the production website and adds a native home-screen widget, system image picking, calendar saving, explicit platform actions and APK update checks. Internet access is required. Website changes reach the app on reload; native changes require a newer signed APK.

## Build on Windows

Install a JDK with `java`, `javac` and `keytool`. Obtain Android tools from their official sources and accept the [Android SDK License Agreement](https://developer.android.com/studio/terms) before use. The script expects this tool layout:

```text
ANDROID_TOOLS/
  aapt2.exe
  android.jar                     Android API 36 platform
  r8-9.5.28.jar
  build-tools-36/
    zipalign.exe
    apksigner.jar
```

From the repository root:

```powershell
.\native\android\build.ps1 -JavaRoot 'C:\path\to\jdk' -ToolRoot 'C:\path\to\ANDROID_TOOLS'
```

The manifest defines the package, version and SDK levels. Outputs default to ignored `.local-artifacts/android/`; intermediate files stay in ignored `native/android/build/`. Use `-OutputDir` to choose another output folder. `-RuntimeDebug` creates a separate debuggable artifact, which the publication script refuses.

The default mode reuses or creates a local **preview** keystore in the tool directory, with Android's conventional preview password. Each builder must retain their own keystore for future updates; the maintainer's file is not shipped in this repository. The downloadable preview retains the existing maintainer certificate so 0.6.0 can upgrade to 0.7.0.

For custom signing, create and manage your own keystore outside the repository, supply `-KeyStorePath` and `-KeyAlias`, and set `PADDOCK_KEYSTORE_PASSWORD` / `PADDOCK_KEY_PASSWORD` privately in your process environment. `-StorePasswordEnv` and `-KeyPasswordEnv` can select different variable names. A missing key password uses the store password variable. Password values are passed to apksigner by environment-variable name, not embedded in source or build reports.

Do not use the preview configuration as an app-store production signing setup. A different certificate cannot update an existing installation signed by the maintainer.

## Publish a verified build

```powershell
node scripts/publish-android.mjs .local-artifacts/android/APK_WEB_BUILD_REPORT.json
npm run check
npm run build
```

The build verifies compilation, APK signing, certificate metadata and ZIP alignment. Publication checks report consistency and APK bytes, then copies the APK and safe update metadata into `public/downloads/`. The web integrity check catches mismatched package / manifest versions, checksums and file sizes.

Before a new release, increase `versionCode` and update `versionName` in `AndroidManifest.xml`, then update the website package version and lockfile to match. The app's user agent and cache migration version derive from its installed package. Preserve the signing identity for in-place upgrades. Never publish keys, environment files, intermediate folders or private reports.

Forks must also update the website / host and update URLs, package identity and widget intent names. The widget's separate fixed upstream data sources have their own network availability and attribution requirements.

## Runtime acceptance

The current release has passed compilation, signature v2/v3, ZIP alignment and metadata verification. On 2026-10-24, the maintainer confirmed completion of real-device validation for Android 0.7.0 and reported that the app works. Download metadata records this confirmation against the published APK's SHA-256.
