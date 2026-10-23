'use client';
import { flushSync } from 'react-dom';
import { createPageMotion, type MotionDirection } from '../lib/page-motion';
import { contentTransition, type MotionKind } from '../lib/content-motion';

// Bound compositor layers to visible blocks instead of rasterizing a whole tall page.
function visibleBlocks(root: HTMLElement) {
  const result: HTMLElement[] = [];
  let visited = 0;
  const walk = (parent: HTMLElement) => {
    for (const child of Array.from(parent.children)) {
      if (!(child instanceof HTMLElement) || result.length >= 6 || ++visited > 40) continue;
      const box = child.getBoundingClientRect();
      if (!box.width || !box.height || box.bottom < 0 || box.top > innerHeight) continue;
      if (box.height > innerHeight * .9 && child.children.length) walk(child);
      else result.push(child);
    }
  };
  walk(root);
  return result;
}
let kind: MotionKind = 'tab';
const motion = createPageMotion({
  enabled: () => typeof document !== 'undefined' && typeof Element.prototype.animate === 'function' && !document.hidden && !matchMedia('(prefers-reduced-motion: reduce)').matches,
  start: update => contentTransition(update, () => {
    const root = document.querySelector<HTMLElement>('.route-content');
    if (!root) return null;
    const blocks = visibleBlocks(root);
    return {
      animate: (frames, options) => {
        const animations = blocks.map((element, index) => element.animate(frames, { ...options, delay: index * 18 }));
        return { finished: Promise.all(animations.map(animation => animation.finished)), cancel: () => animations.forEach(animation => animation.cancel()) };
      },
    };
  }, document.documentElement.dataset.motionDirection === 'back' ? -18 : 18, kind),
  signal: (active, direction) => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.motionEngine = typeof Element.prototype.animate === 'function' ? 'live' : 'css';
    document.documentElement.dataset.motionDirection = direction;
    if (active) document.documentElement.dataset.pageTransition = 'active';
    else delete document.documentElement.dataset.pageTransition;
  },
});
export function transitionPage(update: () => void, direction: MotionDirection = 'forward', nextKind: MotionKind = 'detail') {
  kind = nextKind;
  motion(() => flushSync(update), direction);
}
