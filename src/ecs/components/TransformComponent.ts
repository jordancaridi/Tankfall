export interface Vector2 {
  x: number;
  y: number;
}

export interface TransformComponent {
  position: Vector2;
  rotationHull: number;
  rotationTurret: number;
}
