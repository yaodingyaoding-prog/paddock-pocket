// Fit the complete bounding sphere in both axes, including portrait dialogs.
export function circuitCameraDistance(radius: number, aspect: number, fov = 35) {
  const vertical = fov * Math.PI / 360;
  const horizontal = Math.atan(Math.tan(vertical) * Math.max(.05, aspect));
  return Math.max(1, radius) * 1.12 / Math.sin(Math.min(vertical, horizontal));
}
