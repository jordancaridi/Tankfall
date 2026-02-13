import { assert } from 'chai';
import { createEntity } from '../ecs/entity';
import { runAISystem } from '../ecs/systems/aiSystem';
import { runContactDamageSystem } from '../ecs/systems/contactDamageSystem';
import { createEnemySpawnSystem } from '../ecs/systems/enemySpawnSystem';
import { computeSteeringIntent } from '../ecs/systems/steeringSystem';
import { createWorld } from '../ecs/world';

const setupEnemy = (world = createWorld()) => {
  const playerId = createEntity(world.entities);
  world.playerEntityId = playerId;
  world.transforms.set(playerId, {
    position: { x: 0, y: 0 },
    rotationHull: 0,
    rotationTurret: 0
  });
  world.damageables.set(playerId, { hp: 100, maxHp: 100 });
  world.collisionRadii.set(playerId, { radius: 1 });
  world.factions.set(playerId, { team: 'player' });

  const enemyId = createEntity(world.entities);
  world.transforms.set(enemyId, {
    position: { x: 0, y: 5 },
    rotationHull: 0,
    rotationTurret: 0
  });
  world.kinematics.set(enemyId, {
    velocity: { x: 0, y: 0 },
    moveSpeed: 5,
    turnRateHull: 8,
    turnRateTurret: 0
  });
  world.inputIntents.set(enemyId, { moveX: 0, moveY: 0 });
  world.damageables.set(enemyId, { hp: 35, maxHp: 35 });
  world.collisionRadii.set(enemyId, { radius: 0.9 });
  world.factions.set(enemyId, { team: 'enemy' });
  world.aiStates.set(enemyId, { state: 'acquire' });
  world.targets.set(enemyId, { targetEntityId: playerId });
  world.enemyArchetypes.set(enemyId, { enemyId: 'scout' });

  return { world, playerId, enemyId };
};

describe('Enemy AI systems', () => {
  it('transitions acquire to pursue when target exists', () => {
    const { world, enemyId } = setupEnemy();

    runAISystem(world);

    assert.equal(world.aiStates.get(enemyId)?.state, 'pursue');
  });

  it('transitions pursue to attack when target is within preferred range', () => {
    const { world, enemyId } = setupEnemy();
    const enemyTransform = world.transforms.get(enemyId)!;
    enemyTransform.position.y = 1.2;

    runAISystem(world);

    assert.equal(world.aiStates.get(enemyId)?.state, 'attack');
  });

  it('steering intent points toward target and stops within preferred range', () => {
    const toward = computeSteeringIntent(0, 5, 0, 0, 1.75);
    assert.closeTo(toward.moveX, 0, 0.000001);
    assert.closeTo(toward.moveY, -1, 0.000001);

    const stopped = computeSteeringIntent(0, 1.2, 0, 0, 1.75);
    assert.equal(stopped.moveX, 0);
    assert.equal(stopped.moveY, 0);
  });

  it('applies contact damage on cooldown independent of dt', () => {
    const { world, playerId, enemyId } = setupEnemy();
    world.aiStates.set(enemyId, { state: 'attack' });
    world.transforms.get(enemyId)!.position.y = 1.5;
    world.contactDamages.set(enemyId, {
      damagePerHit: 5,
      hitCooldown: 0.5,
      cooldownRemaining: 0
    });

    runContactDamageSystem(world, 1);

    assert.lengthOf(world.damageQueue, 3);
    assert.deepInclude(world.damageQueue, { targetEntityId: playerId, sourceEntityId: enemyId, amount: 5 });
    assert.closeTo(world.contactDamages.get(enemyId)!.cooldownRemaining, 0.5, 0.000001);
  });

  it('spawns one scout enemy once and does not duplicate', () => {
    const world = createWorld();
    const playerId = createEntity(world.entities);
    world.playerEntityId = playerId;
    world.damageables.set(playerId, { hp: 100, maxHp: 100 });
    world.factions.set(playerId, { team: 'player' });

    const runEnemySpawnSystem = createEnemySpawnSystem(
      {
        enemySpawnTestEnabled: true,
        enemySpawnPos: { x: 4, y: 6 },
        enemyId: 'scout'
      },
      false
    );

    runEnemySpawnSystem(world);
    runEnemySpawnSystem(world);

    const aliveEnemyEntities = Array.from(world.factions.entries()).filter(([entityId, faction]) => {
      const damageable = world.damageables.get(entityId);
      return faction.team === 'enemy' && damageable && damageable.hp > 0;
    });

    assert.lengthOf(aliveEnemyEntities, 1);
  });
});
