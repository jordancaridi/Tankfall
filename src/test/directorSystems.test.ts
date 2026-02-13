import { assert } from 'chai';
import { gameConfig } from '../content/gameConfig';
import { createEntity } from '../ecs/entity';
import { runCleanupSystem } from '../ecs/systems/cleanupSystem';
import {
  computeDifficultyMultipliers,
  createEnemySpawnSystem,
  selectWeightedEnemy
} from '../ecs/systems/enemySpawnSystem';
import { createWorld } from '../ecs/world';

const setupWorld = () => {
  const world = createWorld();
  const playerId = createEntity(world.entities);
  world.playerEntityId = playerId;
  world.transforms.set(playerId, {
    position: { x: 0, y: 0 },
    rotationHull: 0,
    rotationTurret: 0
  });
  world.damageables.set(playerId, { hp: 100, maxHp: 100 });
  world.collisionRadii.set(playerId, { radius: 1.2 });
  world.factions.set(playerId, { team: 'player' });
  return world;
};

const countEnemyIds = (world: ReturnType<typeof createWorld>): number[] =>
  Array.from(world.factions.entries())
    .filter(([, faction]) => faction.team === 'enemy')
    .map(([entityId]) => entityId)
    .sort((a, b) => a - b);

describe('Spawn director systems', () => {
  it('spawns deterministically for a seed and dt sequence', () => {
    const worldA = setupWorld();
    const worldB = setupWorld();

    const runA = createEnemySpawnSystem(gameConfig, 77);
    const runB = createEnemySpawnSystem(gameConfig, 77);

    for (let i = 0; i < 240; i += 1) {
      runA(worldA, 1 / 60);
      runB(worldB, 1 / 60);
    }

    assert.deepEqual(countEnemyIds(worldA), countEnemyIds(worldB));

    const archetypesA = countEnemyIds(worldA).map((entityId) => worldA.enemyArchetypes.get(entityId)?.enemyId);
    const archetypesB = countEnemyIds(worldB).map((entityId) => worldB.enemyArchetypes.get(entityId)?.enemyId);
    assert.deepEqual(archetypesA, archetypesB);
  });

  it('enforces maxActiveEnemies cap', () => {
    const world = setupWorld();
    const runSpawn = createEnemySpawnSystem(gameConfig, 9);

    for (let i = 0; i < 1200; i += 1) {
      runSpawn(world, 1 / 60);
    }

    assert.isAtMost(countEnemyIds(world).length, gameConfig.director.maxActiveEnemies);
  });

  it('weighted selection approximates configured weights', () => {
    const picks = new Map<string, number>();
    let rngState = 123;
    const iterations = 12000;

    for (let i = 0; i < iterations; i += 1) {
      const result = selectWeightedEnemy(gameConfig.director.archetypeWeights, rngState);
      rngState = result.nextState;
      picks.set(result.enemyId, (picks.get(result.enemyId) ?? 0) + 1);
    }

    const totalWeight = gameConfig.director.archetypeWeights.reduce((sum, entry) => sum + entry.weight, 0);
    gameConfig.director.archetypeWeights.forEach((entry) => {
      const observed = (picks.get(entry.enemyId) ?? 0) / iterations;
      const expected = entry.weight / totalWeight;
      assert.closeTo(observed, expected, 0.03, `${entry.enemyId} should be near weighted target`);
    });
  });

  it('scaling multipliers rise smoothly over time', () => {
    const at0 = computeDifficultyMultipliers(0, gameConfig);
    const at30 = computeDifficultyMultipliers(30, gameConfig);
    const at60 = computeDifficultyMultipliers(60, gameConfig);

    assert.isAtLeast(at30.hp, at0.hp);
    assert.isAtLeast(at60.hp, at30.hp);
    assert.isAtLeast(at30.damage, at0.damage);
    assert.isAtLeast(at60.damage, at30.damage);
    assert.isAtLeast(at30.spawnRate, at0.spawnRate);
    assert.isAtLeast(at60.spawnRate, at30.spawnRate);
  });

  it('cleanup removes dead enemies and allows fresh spawns', () => {
    const world = setupWorld();
    const runSpawn = createEnemySpawnSystem(gameConfig, 11);

    for (let i = 0; i < 900; i += 1) {
      runSpawn(world, 1 / 60);
    }

    const initialCount = countEnemyIds(world).length;
    assert.equal(initialCount, gameConfig.director.maxActiveEnemies);

    const firstThree = countEnemyIds(world).slice(0, 3);
    firstThree.forEach((entityId) => {
      world.deadEntities.add(entityId);
      const damageable = world.damageables.get(entityId);
      if (damageable) {
        damageable.hp = 0;
      }
    });

    runCleanupSystem(world);
    assert.equal(countEnemyIds(world).length, initialCount - firstThree.length);

    for (let i = 0; i < 300; i += 1) {
      runSpawn(world, 1 / 60);
    }

    assert.equal(countEnemyIds(world).length, gameConfig.director.maxActiveEnemies);
  });

  it('spawns enemies inside world bounds with padding', () => {
    const world = setupWorld();
    const runSpawn = createEnemySpawnSystem(gameConfig, 21);

    for (let i = 0; i < 180; i += 1) {
      runSpawn(world, 1 / 60);
    }

    const enemyIds = countEnemyIds(world);
    assert.isAbove(enemyIds.length, 0);

    enemyIds.forEach((enemyId) => {
      const position = world.transforms.get(enemyId)!.position;
      assert.isAtLeast(position.x, gameConfig.worldBounds.minX + gameConfig.worldBoundsPadding);
      assert.isAtMost(position.x, gameConfig.worldBounds.maxX - gameConfig.worldBoundsPadding);
      assert.isAtLeast(position.y, gameConfig.worldBounds.minY + gameConfig.worldBoundsPadding);
      assert.isAtMost(position.y, gameConfig.worldBounds.maxY - gameConfig.worldBoundsPadding);
    });
  });
});
