import type { SpawnDirectorStateComponent } from '../components/SpawnDirectorStateComponent';
import type { EcsWorld } from '../world';

export const SPAWN_DIRECTOR_ENTITY_ID = 0;

export const getSpawnDirectorState = (world: EcsWorld): SpawnDirectorStateComponent | undefined =>
  world.spawnDirectorStates.get(SPAWN_DIRECTOR_ENTITY_ID);
