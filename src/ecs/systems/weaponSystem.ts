import { getWeaponDefinition } from '../../content/weapons';
import { spawnProjectile } from '../projectilePool';
import type { EcsWorld } from '../world';
import { queryEntities } from '../world';

const updateCooldown = (value: number, dtSeconds: number): number => Math.max(0, value - dtSeconds);

export const runWeaponSystem = (world: EcsWorld, dtSeconds: number): void => {
  const entities = queryEntities(world.weapons, world.transforms, world.aims);

  entities.forEach((entityId) => {
    const weapon = world.weapons.get(entityId);
    const transform = world.transforms.get(entityId);
    if (!weapon || !transform) {
      return;
    }

    weapon.cooldownPrimary = updateCooldown(weapon.cooldownPrimary, dtSeconds);

    if (!world.inputState.firePrimary || weapon.cooldownPrimary > 0) {
      return;
    }

    const definition = getWeaponDefinition(weapon.weaponIdPrimary);
    const direction = {
      x: Math.sin(transform.rotationTurret),
      y: Math.cos(transform.rotationTurret)
    };
    const didSpawn =
      spawnProjectile(world, {
        ownerId: entityId,
        damage: definition.damage,
        speed: definition.projectileSpeed,
        lifetime: definition.projectileLifetime,
        radius: definition.projectileRadius,
        position: {
          x: transform.position.x + direction.x * definition.muzzleOffset,
          y: transform.position.y + direction.y * definition.muzzleOffset
        },
        direction
      }) !== null;

    if (!didSpawn) {
      return;
    }

    weapon.cooldownPrimary = 1 / definition.fireRate;
  });
};
