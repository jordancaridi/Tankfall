export interface LoopCallbacks {
  updateSimulation: (fixedDtSeconds: number) => void;
  render: (alpha: number) => void;
  onFirstRender?: () => void;
}

export interface LoopController {
  stop: () => void;
}

const FIXED_TIMESTEP_SECONDS = 1 / 60;
const MAX_ACCUMULATED_SECONDS = 0.25;

export const createFixedTimestepLoop = (callbacks: LoopCallbacks): LoopController => {
  let isRunning = true;
  let accumulator = 0;
  let lastTime = performance.now() / 1000;
  let firstRenderDone = false;

  const frame = (): void => {
    if (!isRunning) {
      return;
    }

    const now = performance.now() / 1000;
    const delta = Math.min(now - lastTime, MAX_ACCUMULATED_SECONDS);
    lastTime = now;
    accumulator += delta;

    while (accumulator >= FIXED_TIMESTEP_SECONDS) {
      callbacks.updateSimulation(FIXED_TIMESTEP_SECONDS);
      accumulator -= FIXED_TIMESTEP_SECONDS;
    }

    const alpha = accumulator / FIXED_TIMESTEP_SECONDS;
    callbacks.render(alpha);

    if (!firstRenderDone) {
      firstRenderDone = true;
      callbacks.onFirstRender?.();
    }

    requestAnimationFrame(frame);
  };

  requestAnimationFrame(frame);

  return {
    stop: () => {
      isRunning = false;
    }
  };
};
