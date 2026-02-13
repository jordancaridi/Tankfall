import * as enemiesJson from '../../content/enemies.json';

export interface EnemyDefinition {
  id: string;
  hp: number;
  moveSpeed: number;
  turnRate: number;
  preferredRange: number;
  collisionRadius: number;
  contactDamage: number;
  contactCooldown: number;
  rangedDamage: number;
  rangedCooldown: number;
  rangedRange: number;
}

interface EnemiesContentFile {
  items: EnemyDefinition[];
}

const rawEnemies = enemiesJson as EnemiesContentFile & { default?: EnemiesContentFile };
const content: EnemiesContentFile = rawEnemies.default ?? rawEnemies;

const enemyMap = new Map<string, EnemyDefinition>();
content.items.forEach((enemy) => {
  enemyMap.set(enemy.id, enemy);
});

export const getEnemyDefinition = (enemyId: string): EnemyDefinition => {
  const definition = enemyMap.get(enemyId);
  if (!definition) {
    throw new Error(`Unknown enemy id: ${enemyId}`);
  }

  return definition;
};
