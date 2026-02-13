import type { EcsWorld } from '../world';
import { queryEntities } from '../world';

const inContact = (world: EcsWorld, attackerEntityId: number, targetEntityId: number): boolean => {
  const attackerTransform = world.transforms.get(attackerEntityId);
  const targetTransform = world.transforms.get(targetEntityId);
  const attackerCollider = world.collisionRadii.get(attackerEntityId);
  const targetCollider = world.collisionRadii.get(targetEntityId);

  if (!attackerTransform || !targetTransform || !attackerCollider || !targetCollider) {
    return false;
  }

  const dx = attackerTransform.position.x - targetTransform.position.x;
  const dy = attackerTransform.position.y - targetTransform.position.y;
  const minDistance = attackerCollider.radius + targetCollider.radius;

  return dx * dx + dy * dy <= minDistance * minDistance;
};

export const runContactDamageSystem = (world: EcsWorld, dtSeconds: number): void => {
  const entities = queryEntities(world.contactDamages, world.targets, world.aiStates, world.factions);

  entities.forEach((entityId) => {
    const faction = world.factions.get(entityId);
    const aiState = world.aiStates.get(entityId);
    const target = world.targets.get(entityId);
    const contactDamage = world.contactDamages.get(entityId);

    if (!faction || !aiState || !target || !contactDamage || faction.team !== 'enemy') {
      return;
    }

    contactDamage.cooldownRemaining -= dtSeconds;

    if (aiState.state !== 'attack' || !inContact(world, entityId, target.targetEntityId)) {
      return;
    }

    while (contactDamage.cooldownRemaining <= 0) {
      world.damageQueue.push({
        targetEntityId: target.targetEntityId,
        sourceEntityId: entityId,
        amount: contactDamage.damagePerHit
      });
      contactDamage.cooldownRemaining += contactDamage.hitCooldown;
    }

    contactDamage.cooldownRemaining = Math.max(0, contactDamage.cooldownRemaining);
  });
};
