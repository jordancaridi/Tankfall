import * as gameConfigJson from '../../content/gameConfig.json';

export interface GameConfig {
  simHz: number;
  worldBounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
  worldBoundsPadding: number;
  director: {
    maxActiveEnemies: number;
    spawnBudgetPerSec: number;
    spawnIntervalSec: number;
    eliteEnabled: boolean;
    archetypeWeights: Array<{
      enemyId: string;
      weight: number;
    }>;
    difficulty: {
      timeScale: {
        hpMultPerMin: number;
        damageMultPerMin: number;
        spawnRateMultPerMin: number;
      };
    };
  };
  deterministic: {
    seedDefault: number;
  };
}

const rawConfig = gameConfigJson as GameConfig & { default?: GameConfig };

export const gameConfig: GameConfig = rawConfig.default ?? rawConfig;
