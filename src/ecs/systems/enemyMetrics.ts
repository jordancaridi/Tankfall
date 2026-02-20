import type { EcsWorld } from '../world';

export const countActiveEnemies = (world: EcsWorld): number => {
  let count = 0;

  world.factions.forEach((faction, entityId) => {
    if (faction.team !== 'enemy') {
      return;
    }

    const hp = world.damageables.get(entityId)?.hp ?? 0;
    if (hp > 0 && !world.deadEntities.has(entityId)) {
      count += 1;
    }
  });

  return count;
};
