import type { ComponentStore, EcsWorld } from '../world';

const removeFromStore = <T>(store: ComponentStore<T>, entityId: number): void => {
  store.delete(entityId);
};

const cleanupStores = (world: EcsWorld, entityId: number): void => {
  removeFromStore(world.transforms, entityId);
  removeFromStore(world.kinematics, entityId);
  removeFromStore(world.inputIntents, entityId);
  removeFromStore(world.aims, entityId);
  removeFromStore(world.weapons, entityId);
  removeFromStore(world.projectiles, entityId);
  removeFromStore(world.projectileTags, entityId);
  removeFromStore(world.damageables, entityId);
  removeFromStore(world.factions, entityId);
  removeFromStore(world.targets, entityId);
  removeFromStore(world.aiStates, entityId);
  removeFromStore(world.contactDamages, entityId);
  removeFromStore(world.enemyArchetypes, entityId);
  removeFromStore(world.collisionRadii, entityId);
};

export const runCleanupSystem = (world: EcsWorld): void => {
  const deadEntityIds = Array.from(world.deadEntities.values());
  deadEntityIds.forEach((entityId) => {
    cleanupStores(world, entityId);
    world.deadEntities.delete(entityId);
  });
};
