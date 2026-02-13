import { despawnProjectile } from './projectileSystem';
import type { EcsWorld } from '../world';
import { queryEntities } from '../world';

const isOverlap = (
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number
): boolean => {
  const dx = ax - bx;
  const dy = ay - by;
  const minDistance = ar + br;
  return dx * dx + dy * dy <= minDistance * minDistance;
};

export const runCollisionSystem = (world: EcsWorld): void => {
  const projectileEntities = queryEntities(world.projectiles, world.transforms);
  const targetEntities = queryEntities(world.damageables, world.transforms, world.collisionRadii);

  projectileEntities.forEach((projectileEntityId) => {
    const projectile = world.projectiles.get(projectileEntityId);
    const projectileTransform = world.transforms.get(projectileEntityId);
    if (!projectile || !projectileTransform || !projectile.active) {
      return;
    }

    targetEntities.some((targetEntityId) => {
      if (targetEntityId === projectile.ownerEntityId) {
        return false;
      }

      const targetTransform = world.transforms.get(targetEntityId);
      const targetRadius = world.collisionRadii.get(targetEntityId);
      if (!targetTransform || !targetRadius) {
        return false;
      }

      if (
        !isOverlap(
          projectileTransform.position.x,
          projectileTransform.position.y,
          projectile.radius,
          targetTransform.position.x,
          targetTransform.position.y,
          targetRadius.radius
        )
      ) {
        return false;
      }

      world.damageQueue.push({
        targetEntityId,
        sourceEntityId: projectile.ownerEntityId,
        amount: projectile.damage
      });
      despawnProjectile(world, projectileEntityId);
      return true;
    });
  });
};
