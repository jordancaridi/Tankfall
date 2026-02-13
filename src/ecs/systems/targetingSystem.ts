import type { EcsWorld } from '../world';
import { queryEntities } from '../world';

const isAlive = (world: EcsWorld, entityId: number | null): boolean => {
  if (entityId === null) {
    return false;
  }

  const damageable = world.damageables.get(entityId);
  if (!damageable || damageable.hp <= 0) {
    return false;
  }

  return !world.deadEntities.has(entityId);
};

export const runTargetingSystem = (world: EcsWorld): void => {
  const enemyEntities = queryEntities(world.factions, world.aiStates).filter((entityId) => {
    const faction = world.factions.get(entityId);
    return faction?.team === 'enemy';
  });

  enemyEntities.forEach((enemyEntityId) => {
    const target = world.targets.get(enemyEntityId);
    if (target && isAlive(world, target.targetEntityId)) {
      return;
    }

    if (isAlive(world, world.playerEntityId)) {
      world.targets.set(enemyEntityId, { targetEntityId: world.playerEntityId! });
      return;
    }

    world.targets.delete(enemyEntityId);
  });
};
