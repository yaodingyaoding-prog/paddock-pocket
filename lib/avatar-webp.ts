// Canvas encoders may attach an ICC colour profile even after the original
// photo was redrawn. Keep only image data in the uploaded avatar.
export function stripAvatarMetadata(input: Uint8Array): Uint8Array<ArrayBuffer> {
  const view = new DataView(input.buffer, input.byteOffset, input.byteLength);
  const tag = (offset: number) => String.fromCharCode(...input.subarray(offset, offset + 4));
  if (input.length < 20 || tag(0) !== 'RIFF' || tag(8) !== 'WEBP' || view.getUint32(4, true) + 8 !== input.length) throw new Error('头像编码无效，请重新选图。');
  const parts: Uint8Array[] = []; let offset = 12, length = 12;
  while (offset < input.length) {
    if (offset + 8 > input.length) throw new Error('头像编码不完整。');
    const size = view.getUint32(offset + 4, true), end = offset + 8 + size + size % 2;
    if (end > input.length) throw new Error('头像编码不完整。');
    const kind = tag(offset);
    if (!['ICCP', 'EXIF', 'XMP '].includes(kind)) {
      const part = input.slice(offset, end);
      if (kind === 'VP8X' && size === 10) part[8] &= ~0x2c;
      parts.push(part); length += part.length;
    }
    offset = end;
  }
  const output = new Uint8Array(length); output.set(input.subarray(0, 12));
  new DataView(output.buffer).setUint32(4, length - 8, true);
  offset = 12; for (const part of parts) { output.set(part, offset); offset += part.length; }
  return output;
}
