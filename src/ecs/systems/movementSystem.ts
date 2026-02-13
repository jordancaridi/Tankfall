import type { EcsWorld } from '../world';

export const runMovementSystem = (world: EcsWorld, dtSeconds: number): void => {
  world.velocities.forEach((velocity, entityId) => {
    const transform = world.transforms.get(entityId);
    if (!transform) {
      return;
    }

    transform.x += velocity.x * dtSeconds;
    transform.y += velocity.y * dtSeconds;
    transform.z += velocity.z * dtSeconds;
  });
};
