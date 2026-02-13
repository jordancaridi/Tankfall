import type { EcsWorld } from '../world';

export const runCameraFollowSystem = (world: EcsWorld): void => {
  if (world.playerEntityId === null) {
    return;
  }

  const transform = world.transforms.get(world.playerEntityId);
  if (!transform) {
    return;
  }

  world.adapters.writeCameraTarget({
    x: transform.position.x,
    y: transform.position.y
  });
};
