'use client';
import { flushSync } from 'react-dom';
import { createPageMotion, type MotionDirection } from '../lib/page-motion';
import { contentTransition } from '../lib/content-motion';

const motion = createPageMotion({
  enabled: () => typeof document !== 'undefined' && typeof Element.prototype.animate === 'function' && !document.hidden && !matchMedia('(prefers-reduced-motion: reduce)').matches,
  start: update => contentTransition(update,()=>{
    const element=document.querySelector<HTMLElement>('.route-content');
    return element?{animate:(frames:Keyframe[],options:KeyframeAnimationOptions)=>element.animate(frames,options),sample:()=>{const style=getComputedStyle(element);return {opacity:style.opacity,transform:style.transform};},clear:()=>{element.style.removeProperty('opacity');element.style.removeProperty('transform');}}:null;
  },document.documentElement.style.getPropertyValue('--route-travel')==='-18px'?-18:18),
  signal: (active, direction) => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.motionEngine = typeof Element.prototype.animate === 'function' ? 'live' : 'css';
    document.documentElement.style.setProperty('--route-travel', direction === 'back' ? '-18px' : '18px');
    if (active) document.documentElement.dataset.pageTransition = 'active';
    else delete document.documentElement.dataset.pageTransition;
  },
});
export function transitionPage(update: () => void, direction: MotionDirection = 'forward') { motion(() => flushSync(update), direction); }
