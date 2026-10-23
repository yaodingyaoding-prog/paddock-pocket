import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
const output = '.wrangler/checks/account-ui-cases.mjs';
await build({ entryPoints: ['scripts/account-ui-cases.ts'], outfile: output, bundle: true, platform: 'node', format: 'esm', logLevel: 'silent' });
await import(pathToFileURL(process.cwd() + '/' + output).href + '?run=' + Date.now());
