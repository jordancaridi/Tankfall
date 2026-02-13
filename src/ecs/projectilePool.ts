import { createEntity, type EntityId } from './entity';
import type { EcsWorld } from './world';

export interface ProjectilePool {
  available: EntityId[];
}

export const createProjectilePool = (world: EcsWorld, size: number): ProjectilePool => {
  const available: EntityId[] = [];

  for (let index = 0; index < size; index += 1) {
    const entityId = createEntity(world.entities);
    world.transforms.set(entityId, {
      position: { x: 0, y: 0 },
      rotationHull: 0,
      rotationTurret: 0
    });
    world.projectiles.set(entityId, {
      ownerEntityId: -1,
      damage: 0,
      speed: 0,
      lifetime: 0,
      radius: 0,
      direction: { x: 0, y: 1 },
      age: 0,
      active: false
    });
    world.projectileTags.set(entityId, { value: true });
    available.push(entityId);
  }

  return { available };
};

export const borrowProjectile = (pool: ProjectilePool): EntityId | null => {
  if (pool.available.length === 0) {
    return null;
  }

  const entityId = pool.available[pool.available.length - 1];
  pool.available.length -= 1;
  return entityId;
};

export const releaseProjectile = (pool: ProjectilePool, entityId: EntityId): void => {
  pool.available.push(entityId);
};
