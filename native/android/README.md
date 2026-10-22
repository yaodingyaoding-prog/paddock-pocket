# Android 0.6.0 source

The installed app loads the production website. The native layer provides a desktop AppWidget, explicit OS actions, system image picking and optional APK update checks. It is an online preview, not an offline copy of the old website.

To build on Windows, supply an installed JDK and the previously accepted Android tool directory:

```powershell
.\build.ps1 -JavaRoot 'D:\path\to\jdk' -ToolRoot 'D:\F1push\.tools\android-build'
```

Required tools: aapt2.exe, android.jar, r8-9.5.28.jar, build-tools-36/zipalign.exe and build-tools-36/apksigner.jar. Keep the existing owner-managed signing keystore outside the repository. Rebuilding with a different certificate will not update an existing installation. The current release uses a preview certificate; do not present it as a store production signing setup.

Sources and resources are tracked here. Local build outputs, keystores and secrets must not be committed. The current published manifest and download live in `public/downloads/`. See `docs/refinement-0.6.0.md` for update semantics, widget limits and outstanding Android device acceptance.
