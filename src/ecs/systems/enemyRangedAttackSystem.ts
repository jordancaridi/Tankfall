import { getEnemyDefinition } from '../../content/enemies';
import { spawnProjectile } from '../projectilePool';
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

const normalizeDirection = (x: number, y: number): { x: number; y: number } => {
  const magnitude = Math.hypot(x, y);
  if (magnitude <= Number.EPSILON) {
    return { x: 0, y: 1 };
  }

  return {
    x: x / magnitude,
    y: y / magnitude
  };
};

export const runEnemyRangedAttackSystem = (world: EcsWorld, dtSeconds: number): void => {
  const enemyIds = queryEntities(world.aiStates, world.targets, world.factions, world.enemyArchetypes, world.transforms);

  enemyIds.forEach((enemyId) => {
    const faction = world.factions.get(enemyId);
    const aiState = world.aiStates.get(enemyId);
    const target = world.targets.get(enemyId);
    const archetype = world.enemyArchetypes.get(enemyId);
    const sourceTransform = world.transforms.get(enemyId);
    const targetTransform = target ? world.transforms.get(target.targetEntityId) : null;

    if (!faction || !aiState || !target || !archetype || !sourceTransform || !targetTransform || faction.team !== 'enemy') {
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

    const normalizedDirection = normalizeDirection(
      targetTransform.position.x - sourceTransform.position.x,
      targetTransform.position.y - sourceTransform.position.y
    );

    const didSpawn =
      spawnProjectile(world, {
        ownerId: enemyId,
        damage: definition.rangedDamage,
        speed: definition.rangedProjectileSpeed,
        lifetime: definition.rangedProjectileLifetime,
        radius: definition.rangedProjectileRadius,
        position: {
          x: sourceTransform.position.x + normalizedDirection.x * definition.muzzleOffset,
          y: sourceTransform.position.y + normalizedDirection.y * definition.muzzleOffset
        },
        direction: normalizedDirection
      }) !== null;

    if (!didSpawn) {
      return;
    }

    aiState.attackCooldownRemainingSec = definition.rangedCooldown;
  });
};
