import { build } from 'esbuild';
import { pathToFileURL } from 'node:url';
const output='.wrangler/checks/account-client-cases.mjs';
await build({entryPoints:['scripts/account-client-cases.ts'],outfile:output,bundle:true,platform:'node',format:'esm',packages:'external',loader:{'.css':'empty'},logLevel:'silent'});
await import(pathToFileURL(process.cwd()+'/'+output).href+'?run='+Date.now());
