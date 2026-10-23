import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
const output = '.wrangler/checks/preferences-cases.mjs';
await build({ entryPoints: ['scripts/preferences-cases.ts'], outfile: output, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
await import(pathToFileURL(process.cwd() + '/' + output).href + '?run=' + Date.now());
