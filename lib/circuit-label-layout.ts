type LabelAnchor = {x: number; y: number; width: number; height: number};

// Keep the small set of labels within the canvas and clear of the bottom controls.
export function layoutCircuitLabels(anchors: LabelAnchor[], width: number, height: number) {
  const inset = 6, gap = 4;
  const bottom = height - Math.min(44, height * .2) - inset;
  const placed = anchors.map((anchor, index) => ({
    index,
    x: Math.max(inset, Math.min(anchor.x - anchor.width / 2, width - anchor.width - inset)),
    y: Math.max(inset, Math.min(anchor.y - anchor.height - 10, bottom - anchor.height)),
    height: anchor.height,
  })).sort((a, b) => a.y - b.y || a.index - b.index);
  for (let i = 1; i < placed.length; i++) {
    placed[i].y = Math.max(placed[i].y, placed[i - 1].y + placed[i - 1].height + gap);
  }
  for (let i = placed.length - 1; i >= 0; i--) {
    const limit = i === placed.length - 1 ? bottom : placed[i + 1].y - gap;
    placed[i].y = Math.max(inset, Math.min(placed[i].y, limit - placed[i].height));
  }
  return placed.sort((a, b) => a.index - b.index).map(({x, y}) => ({x, y}));
}
