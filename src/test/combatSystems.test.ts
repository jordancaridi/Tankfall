import { assert } from 'chai';
import { createEntity } from '../ecs/entity';
import { createProjectilePool } from '../ecs/projectilePool';
import type { TransformComponent } from '../ecs/components/TransformComponent';
import { runCollisionSystem } from '../ecs/systems/collisionSystem';
import { runDamageSystem } from '../ecs/systems/damageSystem';
import { runProjectileSystem } from '../ecs/systems/projectileSystem';
import { runWeaponSystem } from '../ecs/systems/weaponSystem';
import { createWorld } from '../ecs/world';

const createTransform = (x: number, y: number): TransformComponent => ({
  position: { x, y },
  rotationHull: 0,
  rotationTurret: 0
});

describe('Combat systems', () => {
  it('respects primary weapon cooldown while holding fire', () => {
    const world = createWorld();
    world.inputState.firePrimary = true;

    const playerId = createEntity(world.entities);
    world.transforms.set(playerId, createTransform(0, 0));
    world.aims.set(playerId, { aimWorld: { x: 0, y: 10 } });
    world.weapons.set(playerId, { weaponIdPrimary: 'player_cannon_m1', cooldownPrimary: 0 });
    world.projectilePool = createProjectilePool(world, 8);

    const dt = 0.1;
    const ticks = 10;

    for (let index = 0; index < ticks; index += 1) {
      runWeaponSystem(world, dt);
      runProjectileSystem(world, dt);
    }

    const activeCount = Array.from(world.projectiles.values()).filter((projectile) => projectile.active).length;
    assert.equal(activeCount, 3);
  });

  it('moves active projectiles and expires them by lifetime', () => {
    const world = createWorld();
    world.projectilePool = createProjectilePool(world, 1);
    const projectileId = world.projectilePool.available.pop();
    assert.isDefined(projectileId);

    const id = projectileId!;
    const projectile = world.projectiles.get(id);
    const transform = world.transforms.get(id);
    assert.exists(projectile);
    assert.exists(transform);

    projectile!.active = true;
    projectile!.speed = 10;
    projectile!.lifetime = 0.25;
    projectile!.radius = 0.2;
    projectile!.damage = 1;
    projectile!.ownerEntityId = -1;
    projectile!.direction.x = 1;
    projectile!.direction.y = 0;

    runProjectileSystem(world, 0.1);
    assert.closeTo(transform!.position.x, 1, 0.000001);
    assert.isTrue(projectile!.active);

    runProjectileSystem(world, 0.2);
    assert.isFalse(projectile!.active);
    assert.equal(world.projectilePool!.available.length, 1);
  });

  it('applies collision damage and despawns projectile', () => {
    const world = createWorld();
    world.projectilePool = createProjectilePool(world, 1);
    const projectileId = world.projectilePool.available.pop()!;

    const targetId = createEntity(world.entities);
    world.transforms.set(targetId, createTransform(1, 0));
    world.collisionRadii.set(targetId, { radius: 0.5 });
    world.damageables.set(targetId, { hp: 25, maxHp: 25 });

    const projectile = world.projectiles.get(projectileId)!;
    const transform = world.transforms.get(projectileId)!;
    projectile.active = true;
    projectile.ownerEntityId = -1;
    projectile.damage = 10;
    projectile.radius = 0.5;
    projectile.speed = 0;
    projectile.lifetime = 1;
    projectile.direction.x = 1;
    projectile.direction.y = 0;
    transform.position.x = 1;
    transform.position.y = 0;

    runCollisionSystem(world);
    runDamageSystem(world);

    assert.equal(world.damageables.get(targetId)!.hp, 15);
    assert.isFalse(projectile.active);
  });

  it('clamps hp at zero in the damage pipeline', () => {
    const world = createWorld();
    const targetId = createEntity(world.entities);
    world.damageables.set(targetId, { hp: 5, maxHp: 5 });
    world.damageQueue.push({ targetEntityId: targetId, sourceEntityId: -1, amount: 99 });

    runDamageSystem(world);

    assert.equal(world.damageables.get(targetId)!.hp, 0);
    assert.isTrue(world.deadEntities.has(targetId));
  });
});
