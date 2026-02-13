export interface PathfindRequest {
  requestId: string;
  start: { x: number; y: number };
  goal: { x: number; y: number };
}

export interface PathfindResponse {
  requestId: string;
  path: Array<{ x: number; y: number }>;
}
