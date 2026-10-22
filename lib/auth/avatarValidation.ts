import { z } from 'zod';
import { AccountError } from './contracts';

export const AVATAR_SIZE = 256;
export const AVATAR_MAX_BYTES = 128 * 1024;
const uploadShape = z.object({ mime: z.literal('image/webp'), length: z.number().int().min(20).max(AVATAR_MAX_BYTES) });
const text = (bytes: Uint8Array, offset: number, length: number) => String.fromCharCode(...bytes.subarray(offset, offset + length));

// Only accept a bounded, static WebP with 256px dimensions and no metadata chunks.
export function validateAvatar(bytes: Uint8Array, mime: string) {
  const invalid = (reason: string) => { console.warn('avatar-validation', { reason }); throw new AccountError('INVALID_AVATAR', '请选择图片并使用裁剪工具生成头像。'); };
  if (!uploadShape.safeParse({ mime, length: bytes.byteLength }).success) invalid('shape');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (text(bytes, 0, 4) !== 'RIFF' || text(bytes, 8, 4) !== 'WEBP' || view.getUint32(4, true) + 8 !== bytes.length) invalid('container');
  let offset = 12, frames = 0, chunks = 0;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length || ++chunks > 8) invalid('chunk-boundary');
    const kind = text(bytes, offset, 4), size = view.getUint32(offset + 4, true), start = offset + 8;
    if (start + size > bytes.length || !['VP8 ', 'VP8L', 'VP8X', 'ALPH'].includes(kind)) invalid('chunk-kind');
    let width = 0, height = 0;
    if (kind === 'VP8 ') {
      if (size < 10 || (bytes[start] & 1) !== 0 || text(bytes, start + 3, 3) !== '\x9d\x01\x2a') invalid('vp8-header');
      width = view.getUint16(start + 6, true) & 0x3fff;
      height = view.getUint16(start + 8, true) & 0x3fff;
      frames++;
    } else if (kind === 'VP8L') {
      if (size < 5 || bytes[start] !== 0x2f) invalid('vp8l-header');
      const bits = view.getUint32(start + 1, true);
      width = (bits & 0x3fff) + 1; height = ((bits >>> 14) & 0x3fff) + 1;
      if (bits >>> 29) invalid('vp8l-version');
      frames++;
    } else if (kind === 'VP8X') {
      if (size !== 10 || (bytes[start] & 0xef) !== 0) invalid('vp8x-flags');
      width = 1 + bytes[start + 4] + (bytes[start + 5] << 8) + (bytes[start + 6] << 16);
      height = 1 + bytes[start + 7] + (bytes[start + 8] << 8) + (bytes[start + 9] << 16);
    }
    if (width && (width !== AVATAR_SIZE || height !== AVATAR_SIZE)) invalid('dimensions');
    offset = start + size + (size % 2);
  }
  if (offset !== bytes.length || frames !== 1) invalid('frame-count');
}
