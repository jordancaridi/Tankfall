import { getWeaponDefinition } from '../../content/weapons';
import { borrowProjectile } from '../projectilePool';
import type { ProjectileComponent } from '../components/ProjectileComponent';
import type { EcsWorld } from '../world';
import { queryEntities } from '../world';

const updateCooldown = (value: number, dtSeconds: number): number => Math.max(0, value - dtSeconds);

const setProjectileDirection = (projectile: ProjectileComponent, rotation: number): void => {
  projectile.direction.x = Math.sin(rotation);
  projectile.direction.y = Math.cos(rotation);
};

export const runWeaponSystem = (world: EcsWorld, dtSeconds: number): void => {
  const entities = queryEntities(world.weapons, world.transforms, world.aims);

  entities.forEach((entityId) => {
    const weapon = world.weapons.get(entityId);
    const transform = world.transforms.get(entityId);
    if (!weapon || !transform) {
      return;
    }

    weapon.cooldownPrimary = updateCooldown(weapon.cooldownPrimary, dtSeconds);

    if (!world.inputState.firePrimary || weapon.cooldownPrimary > 0 || world.projectilePool === null) {
      return;
    }

    const definition = getWeaponDefinition(weapon.weaponIdPrimary);
    const projectileEntityId = borrowProjectile(world.projectilePool);
    if (projectileEntityId === null) {
      return;
    }

    const projectile = world.projectiles.get(projectileEntityId);
    const projectileTransform = world.transforms.get(projectileEntityId);

    if (!projectile || !projectileTransform) {
      return;
    }

    setProjectileDirection(projectile, transform.rotationTurret);
    projectile.ownerEntityId = entityId;
    projectile.damage = definition.damage;
    projectile.speed = definition.projectileSpeed;
    projectile.lifetime = definition.projectileLifetime;
    projectile.radius = definition.projectileRadius;
    projectile.age = 0;
    projectile.active = true;

    projectileTransform.position.x = transform.position.x + projectile.direction.x * definition.muzzleOffset;
    projectileTransform.position.y = transform.position.y + projectile.direction.y * definition.muzzleOffset;
    projectileTransform.rotationTurret = transform.rotationTurret;

    weapon.cooldownPrimary = 1 / definition.fireRate;
  });
};
