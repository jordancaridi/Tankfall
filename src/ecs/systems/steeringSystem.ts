import { getEnemyDefinition } from '../../content/enemies';
import type { EcsWorld } from '../world';
import { queryEntities } from '../world';

const STOP_EPSILON = 0.000001;

export const computeSteeringIntent = (
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  preferredRange: number
): { moveX: number; moveY: number } => {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const distance = Math.hypot(dx, dy);

  if (distance <= preferredRange || distance <= STOP_EPSILON) {
    return { moveX: 0, moveY: 0 };
  }

  return {
    moveX: dx / distance,
    moveY: dy / distance
  };
};

export const runSteeringSystem = (world: EcsWorld): void => {
  const entities = queryEntities(world.aiStates, world.factions, world.inputIntents, world.transforms, world.enemyArchetypes);

  entities.forEach((entityId) => {
    const faction = world.factions.get(entityId);
    if (!faction || faction.team !== 'enemy') {
      return;
    }

    const state = world.aiStates.get(entityId);
    const target = world.targets.get(entityId);
    const intent = world.inputIntents.get(entityId);
    const transform = world.transforms.get(entityId);
    if (!state || !intent || !transform || !target) {
      intent && (intent.moveX = 0);
      intent && (intent.moveY = 0);
      return;
    }

    if (state.state === 'attack' || state.state === 'cooldown') {
      intent.moveX = 0;
      intent.moveY = 0;
      return;
    }

    const targetTransform = world.transforms.get(target.targetEntityId);
    if (!targetTransform) {
      intent.moveX = 0;
      intent.moveY = 0;
      return;
    }

    const enemyArchetype = world.enemyArchetypes.get(entityId);
    if (!enemyArchetype) {
      intent.moveX = 0;
      intent.moveY = 0;
      return;
    }

    const enemyDefinition = getEnemyDefinition(enemyArchetype.enemyId);
    const steering = computeSteeringIntent(
      transform.position.x,
      transform.position.y,
      targetTransform.position.x,
      targetTransform.position.y,
      enemyDefinition.preferredRange
    );

    intent.moveX = steering.moveX;
    intent.moveY = steering.moveY;
  });
};
