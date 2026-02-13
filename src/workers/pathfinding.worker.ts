import type { PathfindRequest, PathfindResponse } from './pathfinding.types';

self.onmessage = (event: MessageEvent<PathfindRequest>): void => {
  const request = event.data;

  const response: PathfindResponse = {
    requestId: request.requestId,
    path: [request.start, request.goal]
  };

  self.postMessage(response);
};
