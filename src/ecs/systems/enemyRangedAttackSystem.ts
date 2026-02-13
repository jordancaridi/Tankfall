import { getEnemyDefinition } from '../../content/enemies';
import type { EcsWorld } from '../world';
import { queryEntities } from '../world';

export const updateAttackCooldown = (remaining: number, dtSeconds: number): number => Math.max(0, remaining - dtSeconds);

export const hasLineOfSight = (): boolean => {
  return true;
};

export const isTargetInRangedAttackRange = (distanceToTarget: number, rangedRange: number): boolean => {
  return distanceToTarget <= rangedRange;
};

const distanceToTarget = (world: EcsWorld, entityId: number, targetEntityId: number): number | null => {
  const source = world.transforms.get(entityId);
  const target = world.transforms.get(targetEntityId);
  if (!source || !target) {
    return null;
  }

  return Math.hypot(target.position.x - source.position.x, target.position.y - source.position.y);
};

export const runEnemyRangedAttackSystem = (world: EcsWorld, dtSeconds: number): void => {
  const enemyIds = queryEntities(world.aiStates, world.targets, world.factions, world.enemyArchetypes);

  enemyIds.forEach((enemyId) => {
    const faction = world.factions.get(enemyId);
    const aiState = world.aiStates.get(enemyId);
    const target = world.targets.get(enemyId);
    const archetype = world.enemyArchetypes.get(enemyId);

    if (!faction || !aiState || !target || !archetype || faction.team !== 'enemy') {
      return;
    }

    aiState.attackCooldownRemainingSec = updateAttackCooldown(aiState.attackCooldownRemainingSec ?? 0, dtSeconds);

    if (aiState.state !== 'attack' || aiState.attackCooldownRemainingSec > 0) {
      return;
    }

    const definition = getEnemyDefinition(archetype.enemyId);
    const distance = distanceToTarget(world, enemyId, target.targetEntityId);
    if (distance === null || !isTargetInRangedAttackRange(distance, definition.rangedRange) || !hasLineOfSight()) {
      return;
    }

    world.damageQueue.push({
      targetEntityId: target.targetEntityId,
      sourceEntityId: enemyId,
      amount: definition.rangedDamage
    });

    aiState.attackCooldownRemainingSec = definition.rangedCooldown;
  });
};
