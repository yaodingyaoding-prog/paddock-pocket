export type MotionKind = 'tab' | 'detail' | 'return';
type RunningAnimation = { finished: Promise<unknown>; cancel(): void };
type Surface = { animate(frames: Keyframe[], options: KeyframeAnimationOptions): RunningAnimation };

export function motionRecipe(kind: MotionKind, travel: number) {
  const sign = travel < 0 ? -1 : 1;
  const start = kind === 'tab' ? `translate3d(0,10px,0)`
    : kind === 'return' ? 'translate3d(-16px,0,0)'
    : `translate3d(${22 * sign}px,0,0)`;
  return {
    frames: [{ opacity: .88, transform: start }, { opacity: 1, transform: 'translate3d(0,0,0)' }],
    options: { duration: kind === 'tab' ? 320 : 360, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' } as KeyframeAnimationOptions,
  };
}

// Commit before animating: input and route state never wait for an exit or a snapshot.
export function contentTransition(update: () => void, current: () => Surface | null, travel: number, kind: MotionKind = 'tab') {
  update();
  const incoming = current();
  const recipe = motionRecipe(kind, travel);
  const animation = incoming?.animate(recipe.frames, recipe.options);
  return {
    ready: Promise.resolve(),
    finished: animation?.finished.catch(() => {}) ?? Promise.resolve(),
    skipTransition() { animation?.cancel(); },
  };
}
