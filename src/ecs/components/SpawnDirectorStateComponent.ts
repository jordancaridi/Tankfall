export interface SpawnDirectorStateComponent {
  elapsedSec: number;
  spawnAccumulator: number;
  intervalAccumulator: number;
  nextSpawnId: number;
  rngState: number;
}
