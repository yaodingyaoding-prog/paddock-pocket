export type MotionDirection = 'forward' | 'back';
type Transition = { ready: Promise<unknown>; finished: Promise<unknown>; skipTransition(): void };
type Environment = { enabled(): boolean; start(update: () => void): Transition; signal(active: boolean, direction: MotionDirection): void };

// A newer navigation wins even if an earlier snapshot has not finished capturing.
export function createPageMotion(environment: Environment) {
  let generation = 0, active: Transition | undefined;
  return (update: () => void, direction: MotionDirection = 'forward') => {
    const version = ++generation;
    active?.skipTransition(); active = undefined;
    let committed = false;
    const commit = () => { if (version === generation && !committed) { committed = true; update(); } };
    if (!environment.enabled()) { environment.signal(false, direction); commit(); return; }
    environment.signal(true, direction);
    try {
      const transition = environment.start(commit); active = transition;
      void transition.ready.catch(() => {});
      void transition.finished.catch(() => {}).finally(() => { commit(); if (version === generation) { active = undefined; environment.signal(false, direction); } });
    } catch { commit(); if (version === generation) environment.signal(false, direction); }
  };
}
