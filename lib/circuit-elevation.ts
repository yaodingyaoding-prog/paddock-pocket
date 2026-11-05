export type ElevationPoint = [number, number, number];
export type ElevationProfile = { version: number; points: ElevationPoint[] };

export function buildElevationRibbon(profile: ElevationProfile, verticalScale = 3) {
  const points = profile?.points;
  if (profile?.version !== 1 || !Array.isArray(points) || points.length < 4 || points.length > 4097 ||
      !points.every(point => Array.isArray(point) && point.length === 3 && point.every(Number.isFinite)) ||
      !Number.isFinite(verticalScale) || verticalScale <= 0) {
    throw new Error('Invalid circuit elevation profile');
  }
  if (points[0].some((value, axis) => value !== points[points.length - 1][axis])) {
    throw new Error('Circuit elevation profile must be closed');
  }
  const lap = points.slice(0, -1);
  const east = lap.map(point => point[0]);
  const north = lap.map(point => point[1]);
  const elevations = lap.map(point => point[2]);
  const minEast = Math.min(...east), maxEast = Math.max(...east);
  const minNorth = Math.min(...north), maxNorth = Math.max(...north);
  const span = Math.max(maxEast - minEast, maxNorth - minNorth);
  if (span <= 0) throw new Error('Invalid circuit extent');
  const scale = 100 / span;
  const minElevation = Math.min(...elevations), maxElevation = Math.max(...elevations);
  const midElevation = (minElevation + maxElevation) / 2;
  const centerline = lap.map(([x, y, altitude]): ElevationPoint => [
    (x - (minEast + maxEast) / 2) * scale,
    (altitude - midElevation) * scale * verticalScale,
    -(y - (minNorth + maxNorth) / 2) * scale,
  ]);
  const positions: number[] = [], colors: number[] = [], indices: number[] = [];
  for (let i = 0; i < lap.length; i++) {
    const previous = centerline[(i + lap.length - 1) % lap.length];
    const next = centerline[(i + 1) % lap.length];
    const dx = next[0] - previous[0], dz = next[2] - previous[2];
    const tangentLength = Math.hypot(dx, dz);
    if (!tangentLength) throw new Error('Invalid circuit tangent');
    const offsetX = -dz / tangentLength * 0.65;
    const offsetZ = dx / tangentLength * 0.65;
    const [x, y, z] = centerline[i];
    positions.push(x + offsetX, y, z + offsetZ, x - offsetX, y, z - offsetZ,
      x + offsetX, y - 0.4, z + offsetZ, x - offsetX, y - 0.4, z - offsetZ);
    const ratio = (elevations[i] - minElevation) / (maxElevation - minElevation || 1);
    const color = [0.13 + ratio * 0.87, 0.76 - ratio * 0.11, 0.83 - ratio * 0.58];
    colors.push(...color, ...color, ...color.map(value => value * 0.48), ...color.map(value => value * 0.48));
    const a = i * 4, b = ((i + 1) % lap.length) * 4;
    indices.push(a, b, a + 1, a + 1, b, b + 1,
      a + 2, a + 3, b + 2, a + 3, b + 3, b + 2,
      a, a + 2, b, a + 2, b + 2, b,
      a + 1, b + 1, a + 3, a + 3, b + 1, b + 3);
  }
  return {
    positions: new Float32Array(positions), colors: new Float32Array(colors), indices: new Uint16Array(indices),
    centerline, minElevation, maxElevation,
    highest: centerline[elevations.indexOf(maxElevation)],
    lowest: centerline[elevations.indexOf(minElevation)],
    floorY: (minElevation - midElevation) * scale * verticalScale - 2.5,
  };
}
