import type { UISnapshot } from '../../ui/uiSnapshot';
import { defaultUISnapshot } from '../../ui/uiSnapshot';
import type { EcsWorld } from '../world';
import { countActiveEnemies } from './enemyMetrics';
import { getSpawnDirectorState } from './spawnDirectorState';

export const buildUISnapshot = (world: EcsWorld): UISnapshot => {
  const playerId = world.playerEntityId;
  const playerDamageable = playerId === null ? null : world.damageables.get(playerId) ?? null;
  const elapsedTimeSec = getSpawnDirectorState(world)?.elapsedSec ?? 0;

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
