import type { UISnapshot } from '../../ui/uiSnapshot';
import { defaultUISnapshot } from '../../ui/uiSnapshot';
import type { EcsWorld } from '../world';

const DIRECTOR_ENTITY_ID = 0;

const countActiveEnemies = (world: EcsWorld): number => {
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

export const buildUISnapshot = (world: EcsWorld): UISnapshot => {
  const playerId = world.playerEntityId;
  const playerDamageable = playerId === null ? null : world.damageables.get(playerId) ?? null;
  const elapsedTimeSec = world.spawnDirectorStates.get(DIRECTOR_ENTITY_ID)?.elapsedSec ?? 0;

  if (!playerDamageable) {
    return {
      ...defaultUISnapshot,
      elapsedTimeSec,
      activeEnemyCount: countActiveEnemies(world)
    };
  }

  return {
    playerHp: playerDamageable.hp,
    playerMaxHp: playerDamageable.maxHp,
    activeEnemyCount: countActiveEnemies(world),
    elapsedTimeSec
  };
};

export const runUISyncSystem = (world: EcsWorld): void => {
  world.uiSnapshot = buildUISnapshot(world);
  world.adapters.writeUISnapshot(world.uiSnapshot);
};
