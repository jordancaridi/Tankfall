import { getEnemyDefinition } from '../../content/enemies';
import type { EnemyAIState } from '../components/AIStateComponent';
import type { EcsWorld } from '../world';
import { queryEntities } from '../world';

const ATTACK_RANGE_BUFFER_UNITS = 0.15;

const getDistance = (world: EcsWorld, entityA: number, entityB: number): number | null => {
  const transformA = world.transforms.get(entityA);
  const transformB = world.transforms.get(entityB);
  if (!transformA || !transformB) {
    return null;
  }

  return Math.hypot(transformB.position.x - transformA.position.x, transformB.position.y - transformA.position.y);
};

export const evaluateEnemyState = (distanceToTarget: number | null, preferredRange: number, hasTarget: boolean): EnemyAIState => {
  if (!hasTarget || distanceToTarget === null) {
    return 'acquire';
  }

  if (distanceToTarget > preferredRange) {
    return 'pursue';
  }

  if (distanceToTarget <= Math.max(0, preferredRange - ATTACK_RANGE_BUFFER_UNITS)) {
    return 'attack';
  }

  return 'cooldown';
};

export const runAISystem = (world: EcsWorld): void => {
  const entities = queryEntities(world.aiStates, world.factions, world.enemyArchetypes);

  entities.forEach((entityId) => {
    const faction = world.factions.get(entityId);
    const aiState = world.aiStates.get(entityId);
    if (!faction || !aiState || faction.team !== 'enemy') {
      return;
    }

    const target = world.targets.get(entityId);
    const kinematics = world.kinematics.get(entityId);
    if (!kinematics) {
      return;
    }

    const enemyArchetype = world.enemyArchetypes.get(entityId);
    if (!enemyArchetype) {
      return;
    }

    const enemyDefinition = getEnemyDefinition(enemyArchetype.enemyId);
    const distanceToTarget = target ? getDistance(world, entityId, target.targetEntityId) : null;
    const nextState = evaluateEnemyState(distanceToTarget, enemyDefinition.preferredRange, Boolean(target));

    aiState.state = nextState;
  });
};
