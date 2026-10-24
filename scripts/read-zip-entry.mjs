import { inflateRawSync } from 'node:zlib';
// Read a named member from the bounded release archives/APKs produced by this project.
export function zipEntry(archive, name) {
  let end = -1;
  for (let i = archive.length - 22; i >= Math.max(0, archive.length - 65557); i--) {
    if (archive.readUInt32LE(i) === 0x06054b50 && i + 22 + archive.readUInt16LE(i + 20) === archive.length) { end = i; break; }
  }
  if (end < 0) throw new Error('ZIP directory not found');
  const count = archive.readUInt16LE(end + 10);
  let offset = archive.readUInt32LE(end + 16);
  for (let i = 0; i < count; i++) {
    if (archive.readUInt32LE(offset) !== 0x02014b50) throw new Error('Invalid ZIP directory');
    const method = archive.readUInt16LE(offset + 10), size = archive.readUInt32LE(offset + 20), length = archive.readUInt16LE(offset + 28);
    if (archive.subarray(offset + 46, offset + 46 + length).toString('utf8') === name) {
      const local = archive.readUInt32LE(offset + 42);
      if (archive.readUInt32LE(local) !== 0x04034b50) throw new Error('Invalid ZIP member');
      const start = local + 30 + archive.readUInt16LE(local + 26) + archive.readUInt16LE(local + 28);
      if (start + size > archive.length) throw new Error('Truncated ZIP member');
      const bytes = archive.subarray(start, start + size);
      if (method === 0) return bytes;
      if (method === 8) return inflateRawSync(bytes, { maxOutputLength: 4 * 1024 * 1024 });
      throw new Error('Unsupported ZIP compression');
    }
    offset += 46 + length + archive.readUInt16LE(offset + 30) + archive.readUInt16LE(offset + 32);
  }
  throw new Error('Missing archive member: ' + name);
}
