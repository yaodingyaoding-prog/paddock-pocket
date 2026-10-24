import fs from 'node:fs';import assert from 'node:assert/strict';
const page=fs.readFileSync('app/paddock-app.tsx','utf8');
assert.ok(!page.includes('前往原站')&&!page.includes('进入原站')&&!page.includes('href={\'https://f1push.com/\''),'Discovery tools must work inside the app');
assert.ok(page.includes('ToolsHub'),'Telemetry and knowledge tools must be rendered locally');
assert.ok(page.includes('weather-slot'),'Weather must occupy a full dashboard row');
assert.ok(fs.existsSync('app/circuit-scene.tsx'),'Interactive 3D renderer required');
assert.ok(fs.existsSync('lib/driver-portraits.json'),'Historical portrait identity mapping required');
console.log('V4 feature entry points verified');
