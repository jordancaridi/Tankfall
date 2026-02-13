import type { PathfindRequest, PathfindResponse } from './pathfinding.types';

export const createPathfindingWorker = (): Worker => {
  return new Worker(new URL('./pathfinding.worker.ts', import.meta.url), { type: 'module' });
};

export const requestPath = (worker: Worker, payload: PathfindRequest): Promise<PathfindResponse> => {
  return new Promise((resolve) => {
    const listener = (event: MessageEvent<PathfindResponse>): void => {
      if (event.data.requestId !== payload.requestId) {
        return;
      }

      worker.removeEventListener('message', listener);
      resolve(event.data);
    };

    worker.addEventListener('message', listener);
    worker.postMessage(payload);
  });
};
