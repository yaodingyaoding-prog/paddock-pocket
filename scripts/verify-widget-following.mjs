import {build} from 'esbuild';import {pathToFileURL} from 'node:url';
await build({entryPoints:['scripts/widget-following-cases.ts'],outfile:'.wrangler/checks/widget-following.mjs',bundle:true,platform:'node',format:'esm',logLevel:'silent'});
await import(pathToFileURL(process.cwd()+'/.wrangler/checks/widget-following.mjs').href+'?run='+Date.now());
