import { spawnSync } from 'node:child_process';
const scripts = [
  ['node_modules/typescript/bin/tsc', '--noEmit'],
  ['scripts/verify-results.mjs'],
  ['scripts/verify-championship.mjs'],
  ['scripts/verify-telemetry.mjs'],
  ['scripts/verify-v4.mjs'],
  ['scripts/verify-weather-viewing.mjs'],
  ['scripts/verify-portraits.mjs'],
  ['scripts/verify-boot-status.mjs'],
  ['scripts/verify-fonts.mjs'],
  ['scripts/verify-replays.mjs'],
  ['scripts/verify-auth.mjs'],
];
for (const args of scripts) {
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
