import fs from 'node:fs';

// Full research and attribution remain in the source files and public credits.
// Only the identity lookup needed to display a portrait belongs in the browser.
const people = JSON.parse(fs.readFileSync('lib/driver-portraits.json', 'utf8')).drivers;
const identities = JSON.parse(fs.readFileSync('lib/driver-portrait-identities.json', 'utf8')).drivers;
const normal = name => name.normalize('NFKD').replace(/[\p{M}\p{P}\p{Z}\s]/gu, '').toLowerCase();
const images = {}, names = {}, ids = {};
for (const person of Object.values(people)) {
  if (!person.image) continue;
  images[person.driverId] = person.image;
  for (const name of [person.givenName + ' ' + person.familyName, person.wikidataNameZh, person.wikidataLabel,
    ...Object.values(identities).filter(r => r.jolpicaDriverId === person.driverId).flatMap(r => r.aliases || [])]) {
    if (typeof name === 'string' && name.length > 2) names[normal(name)] = person.driverId;
  }
}
for (const [id, person] of Object.entries(identities)) ids[id] = person.jolpicaDriverId;
fs.writeFileSync('lib/portrait-index.json', JSON.stringify({ images, names, ids }) + '\n');
console.log(`Generated ${Object.keys(images).length} portrait images and ${Object.keys(names).length} name lookups.`);
