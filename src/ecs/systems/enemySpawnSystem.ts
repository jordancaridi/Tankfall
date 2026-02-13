import { getEnemyDefinition } from '../../content/enemies';
import type { GameConfig } from '../../content/gameConfig';
import { createEntity } from '../entity';
import type { EcsWorld } from '../world';

const isEnemyAlive = (world: EcsWorld, entityId: number): boolean => {
  const faction = world.factions.get(entityId);
  if (!faction || faction.team !== 'enemy') {
    return false;
  }

  const damageable = world.damageables.get(entityId);
  if (!damageable || damageable.hp <= 0) {
    return false;
  }

  return !world.deadEntities.has(entityId);
};

export const createEnemySpawnSystem = (config: GameConfig, testMode: boolean) => {
  const spawnEnabled = config.enemySpawnTestEnabled || testMode;

  return (world: EcsWorld): void => {
    if (!spawnEnabled) {
      return;
    }

    const hasAliveEnemy = Array.from(world.factions.keys()).some((entityId) => isEnemyAlive(world, entityId));
    if (hasAliveEnemy) {
      return;
    }

    const enemyDefinition = getEnemyDefinition(config.enemyId);
    const enemyEntityId = createEntity(world.entities);

    world.transforms.set(enemyEntityId, {
      position: { x: config.enemySpawnPos.x, y: config.enemySpawnPos.y },
      rotationHull: 0,
      rotationTurret: 0
    });
    world.kinematics.set(enemyEntityId, {
      velocity: { x: 0, y: 0 },
      moveSpeed: enemyDefinition.moveSpeed,
      turnRateHull: enemyDefinition.turnRate,
      turnRateTurret: 0
    });
    world.inputIntents.set(enemyEntityId, { moveX: 0, moveY: 0 });
    world.damageables.set(enemyEntityId, { hp: enemyDefinition.hp, maxHp: enemyDefinition.hp });
    world.collisionRadii.set(enemyEntityId, { radius: enemyDefinition.collisionRadius });
    world.factions.set(enemyEntityId, { team: 'enemy' });
    world.aiStates.set(enemyEntityId, { state: 'acquire' });
    world.enemyArchetypes.set(enemyEntityId, { enemyId: enemyDefinition.id });

    if (enemyDefinition.attack) {
      world.contactDamages.set(enemyEntityId, {
        damagePerHit: enemyDefinition.attack.damagePerHit,
        hitCooldown: enemyDefinition.attack.hitCooldown,
        cooldownRemaining: 0
      });
    }
  };
};
