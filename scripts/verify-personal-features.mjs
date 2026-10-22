import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
const outfile = '.wrangler/checks/personal-feature-cases.mjs';
await build({entryPoints:['scripts/personal-feature-cases.ts'],outfile,bundle:true,platform:'node',format:'esm',packages:'external'});
const result=spawnSync(process.execPath,[outfile],{stdio:'inherit'});
if(result.error)throw result.error;
process.exit(result.status??1);
