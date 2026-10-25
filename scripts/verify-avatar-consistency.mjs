import {build} from 'esbuild';
import {pathToFileURL} from 'node:url';
await build({entryPoints:['scripts/avatar-consistency-cases.ts'],outfile:'.wrangler/checks/avatar-consistency.mjs',bundle:true,platform:'node',format:'esm',packages:'external',logLevel:'silent'});
await import(pathToFileURL(process.cwd()+'/.wrangler/checks/avatar-consistency.mjs').href+'?run='+Date.now());
