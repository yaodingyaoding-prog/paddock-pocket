import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
const output = '.wrangler/checks/race-refresh-cases.mjs';
await build({ entryPoints: ['scripts/race-refresh-cases.ts'], outfile: output, bundle: true, packages: 'external', platform: 'node', format: 'esm', target: 'node24', logLevel: 'silent' });
await import(pathToFileURL(process.cwd() + '/' + output).href + '?run=' + Date.now());
