import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import ts from 'typescript';

const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const historical = read('lib/driver-portraits.json').drivers;
const identities = read('lib/driver-portrait-identities.json').drivers;
const drivers = read('lib/snapshots/drivers_standings_2026_zh.json').data;
const normal = name => name.normalize('NFKD').replace(/[\p{M}\p{P}\p{Z}\s]/gu, '').toLowerCase();
const official = new Map(drivers.items[0].standings.map(d => [d.driverId, '/drivers/' + d.tla.toLowerCase() + '.webp']));
const names = new Map();
for (const person of Object.values(historical)) {
  if (!person.image) continue;
  for (const name of [person.givenName + ' ' + person.familyName, person.wikidataNameZh, person.wikidataLabel,
    ...Object.values(identities).filter(r => r.jolpicaDriverId === person.driverId).flatMap(r => r.aliases || [])]) {
    if (typeof name === 'string' && name.length > 2) names.set(normal(name), person);
  }
}
function legacy(driver) {
  const exact = official.get(driver.driverId);
  if (exact) return { file: exact, historical: false };
  const id = identities[driver.driverId]?.jolpicaDriverId;
  let match = id ? historical[id] : undefined;
  if (!match?.image) for (const name of [driver.driverName, driver.name, driver.driverNameKey,
    driver.firstName && driver.lastName ? driver.firstName + ' ' + driver.lastName : '']) {
    if (name && names.has(normal(name))) { match = names.get(normal(name)); break; }
  }
  return match?.image ? { file: match.image, historical: true } : undefined;
}

// Exercise the real TypeScript implementation without needing a browser or changing JSON import syntax.
const source = fs.readFileSync('lib/portrait.ts', 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2022 },
}).outputText;
const exports = {};
new Function('require', 'exports', compiled)(specifier => specifier === './snapshots'
  ? { snapshots: { drivers } } : read(path.join('lib', specifier)), exports);
const cases = [{}, { driverId: 'unknown', driverName: 'Unknown Driver' }, ...drivers.items[0].standings];
for (const [driverId, person] of Object.entries(historical)) {
  cases.push({ driverId }, { driverName: person.givenName + ' ' + person.familyName },
    { firstName: person.givenName, lastName: person.familyName },
    { name: person.wikidataNameZh }, { driverNameKey: person.wikidataLabel });
}
for (const [driverId, person] of Object.entries(identities)) {
  cases.push({ driverId });
  for (const name of person.aliases || []) cases.push({ driverName: name }, { name: name.toUpperCase() });
}
for (const [name, person] of names) {
  cases.push({ driverName: name }, { driverId: 'unknown', driverName: name });
  assert.ok(person.image.startsWith('/drivers/'), 'Portraits must remain local files');
}
for (const driver of cases) assert.deepEqual(exports.portraitFor(driver), legacy(driver), JSON.stringify(driver));
const jsonImports = [...source.matchAll(/from\s+['"]([^'"]+\.json)['"]/g)].map(match => path.join('lib', match[1]));
const runtimeBytes = jsonImports.reduce((sum, file) => sum + fs.statSync(file).size, 0);
assert.ok(runtimeBytes < 100_000, `Portrait runtime metadata must stay below 100 KB; actual ${runtimeBytes}`);
assert.ok(fs.existsSync('public/drivers/history/credits.json'), 'Keep complete public attribution records');
console.log(`${cases.length} portrait mapping regressions passed; runtime metadata ${runtimeBytes} bytes.`);
