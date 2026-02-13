import { releaseProjectile } from '../projectilePool';
import type { EcsWorld } from '../world';
import { queryEntities } from '../world';

export const despawnProjectile = (world: EcsWorld, entityId: number): void => {
  const projectile = world.projectiles.get(entityId);
  if (!projectile || !projectile.active || world.projectilePool === null) {
    return;
  }

  projectile.active = false;
  releaseProjectile(world.projectilePool, entityId);
};

export const runProjectileSystem = (world: EcsWorld, dtSeconds: number): void => {
  const projectileEntities = queryEntities(world.projectiles, world.transforms);

  projectileEntities.forEach((entityId) => {
    const projectile = world.projectiles.get(entityId);
    const transform = world.transforms.get(entityId);
    if (!projectile || !transform || !projectile.active) {
      return;
    }

    transform.position.x += projectile.direction.x * projectile.speed * dtSeconds;
    transform.position.y += projectile.direction.y * projectile.speed * dtSeconds;
    projectile.age += dtSeconds;

    if (projectile.age >= projectile.lifetime) {
      despawnProjectile(world, entityId);
    }
  });
};
