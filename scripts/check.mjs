import { spawnSync } from 'node:child_process';
const scripts = [
  ['node_modules/typescript/bin/tsc', '--noEmit'],
  ['scripts/verify-results.mjs'],
  ['scripts/verify-championship.mjs'],
  ['scripts/verify-telemetry.mjs'],
  ['scripts/verify-technical-language.mjs'],
  ['scripts/verify-v4.mjs'],
  ['scripts/verify-news.mjs'],
  ['scripts/verify-circuit-camera.mjs'],
  ['scripts/verify-weather-viewing.mjs'],
  ['scripts/verify-portraits.mjs'],
  ['scripts/verify-boot-status.mjs'],
  ['scripts/verify-fonts.mjs'],
  ['scripts/verify-replays.mjs'],
  ['scripts/verify-auth.mjs'],
  ['scripts/verify-personal-features.mjs'],
  ['scripts/verify-race-refresh.mjs'],
  ['scripts/verify-motion.mjs'],
  ['scripts/verify-android-release.mjs'],
  ['scripts/verify-native-behavior.mjs'],
  ['scripts/verify-build-source.mjs'],
  ['scripts/verify-viewing-release.mjs'],
  ['scripts/verify-share.mjs'],
  ['scripts/verify-account-ui.mjs'],
  ['scripts/verify-account-client.mjs'],
  ['scripts/verify-preferences.mjs'],
  ['scripts/verify-widget-following.mjs'],
  ['scripts/verify-startup-recovery.mjs'],
  ['scripts/verify-download.mjs'],
  ['scripts/verify-race-data.mjs'],
  ['scripts/verify-public-read.mjs'],
  ['scripts/verify-avatar-encoding.mjs'],
  ['scripts/verify-avatar-consistency.mjs'],
];
for (const args of scripts) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
