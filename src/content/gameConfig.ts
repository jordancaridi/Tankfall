import * as gameConfigJson from '../../content/gameConfig.json';

export interface GameConfig {
  enemySpawnTestEnabled: boolean;
  enemySpawnPos: {
    x: number;
    y: number;
  };
  enemyId: string;
}

const rawConfig = gameConfigJson as GameConfig & { default?: GameConfig };

export const gameConfig: GameConfig = rawConfig.default ?? rawConfig;
