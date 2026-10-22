export function avatarCrop(width: number, height: number, zoom: number, x: number, y: number) {
  const scale = Math.max(1, Math.min(3, Number.isFinite(zoom) ? zoom : 1));
  const side = Math.min(width, height) / scale;
  return { side, sx: Math.max(0, width - side) * Math.max(0, Math.min(1, x)), sy: Math.max(0, height - side) * Math.max(0, Math.min(1, y)) };
}
