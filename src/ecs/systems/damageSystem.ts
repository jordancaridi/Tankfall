import type { EcsWorld } from '../world';

export const runDamageSystem = (world: EcsWorld): void => {
  while (world.damageQueue.length > 0) {
    const event = world.damageQueue.shift();
    if (!event) {
      break;
    }

    const damageable = world.damageables.get(event.targetEntityId);
    if (!damageable) {
      continue;
    }

    const mitigated = Math.max(0, event.amount - (damageable.armor ?? 0));
    damageable.hp = Math.max(0, damageable.hp - mitigated);
    if (damageable.hp <= 0) {
      world.deadEntities.add(event.targetEntityId);
    }
  }
};
