import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
await mkdir('.wrangler/checks', { recursive: true });
const output = '.wrangler/checks/auth-cases.mjs';
await build({ entryPoints: ['scripts/auth-cases.ts'], outfile: output, bundle: true, packages: 'external', platform: 'node', format: 'esm', target: 'node24', logLevel: 'silent' });
await import(pathToFileURL(process.cwd() + '/' + output).href + '?run=' + Date.now());
