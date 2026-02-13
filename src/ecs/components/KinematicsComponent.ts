import type { Vector2 } from './TransformComponent';

export interface KinematicsComponent {
  velocity: Vector2;
  moveSpeed: number;
  turnRateHull: number;
  turnRateTurret: number;
}
