import type { EntityId } from './entity';
import type { HealthComponent } from './components/HealthComponent';
import type { TransformComponent } from './components/TransformComponent';
import type { VelocityComponent } from './components/VelocityComponent';

export interface EcsWorld {
  transforms: Map<EntityId, TransformComponent>;
  velocities: Map<EntityId, VelocityComponent>;
  health: Map<EntityId, HealthComponent>;
}

export const createWorld = (): EcsWorld => ({
  transforms: new Map(),
  velocities: new Map(),
  health: new Map()
});
