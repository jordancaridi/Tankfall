import { createEntity, type EntityId } from './entity';
import type { Vector2 } from './components/TransformComponent';
import type { EcsWorld } from './world';

export interface ProjectilePool {
  available: EntityId[];
}

export interface SpawnProjectileConfig {
  ownerId: EntityId;
  damage: number;
  speed: number;
  lifetime: number;
  radius: number;
  position: Vector2;
  direction: Vector2;
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

const normalizeDirection = (direction: Vector2): Vector2 => {
  const magnitude = Math.hypot(direction.x, direction.y);
  if (magnitude <= Number.EPSILON) {
    return { x: 0, y: 1 };
  }

  return {
    x: direction.x / magnitude,
    y: direction.y / magnitude
  };
};

export const spawnProjectile = (world: EcsWorld, config: SpawnProjectileConfig): EntityId | null => {
  if (world.projectilePool === null) {
    return null;
  }

  const projectileEntityId = borrowProjectile(world.projectilePool);
  if (projectileEntityId === null) {
    return null;
  }

  const projectile = world.projectiles.get(projectileEntityId);
  const projectileTransform = world.transforms.get(projectileEntityId);
  if (!projectile || !projectileTransform) {
    return null;
  }

  const normalizedDirection = normalizeDirection(config.direction);
  projectile.ownerEntityId = config.ownerId;
  projectile.damage = config.damage;
  projectile.speed = config.speed;
  projectile.lifetime = config.lifetime;
  projectile.radius = config.radius;
  projectile.direction.x = normalizedDirection.x;
  projectile.direction.y = normalizedDirection.y;
  projectile.age = 0;
  projectile.active = true;

  projectileTransform.position.x = config.position.x;
  projectileTransform.position.y = config.position.y;
  projectileTransform.rotationTurret = Math.atan2(normalizedDirection.x, normalizedDirection.y);

  return projectileEntityId;
};
