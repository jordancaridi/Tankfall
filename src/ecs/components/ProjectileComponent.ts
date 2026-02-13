import type { EntityId } from '../entity';
import type { Vector2 } from './TransformComponent';

export interface ProjectileComponent {
  ownerEntityId: EntityId;
  damage: number;
  speed: number;
  lifetime: number;
  radius: number;
  direction: Vector2;
  age: number;
  active: boolean;
}
