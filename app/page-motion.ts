'use client';
import { flushSync } from 'react-dom';
import { createPageMotion, type MotionDirection } from '../lib/page-motion';

const motion = createPageMotion({
  enabled: () => typeof document !== 'undefined' && typeof document.startViewTransition === 'function' && !document.hidden && !matchMedia('(prefers-reduced-motion: reduce)').matches,
  start: update => document.startViewTransition(update),
  signal: (active, direction) => {
    if (typeof document === 'undefined') return;
    document.documentElement.style.setProperty('--route-travel', direction === 'back' ? '-46px' : '46px');
    if (active) document.documentElement.dataset.pageTransition = 'active';
    else delete document.documentElement.dataset.pageTransition;
  },
});
export function transitionPage(update: () => void, direction: MotionDirection = 'forward') { motion(() => flushSync(update), direction); }
