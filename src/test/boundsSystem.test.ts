import { assert } from 'chai';
import { gameConfig } from '../content/gameConfig';
import { createEntity } from '../ecs/entity';
import { clampPositionToBounds, createBoundsSystem } from '../ecs/systems/boundsSystem';
import { createWorld } from '../ecs/world';

describe('BoundsSystem', () => {
  it('clamps positions using configured bounds and padding', () => {
    const clamped = clampPositionToBounds(
      { x: 100, y: -100 },
      { minX: -10, maxX: 10, minY: -4, maxY: 4 },
      1
    );

    assert.equal(clamped.x, 9);
    assert.equal(clamped.y, -3);
  });

  it('applies to player and enemy entities after movement', () => {
    const world = createWorld();
    const playerId = createEntity(world.entities);
    const enemyId = createEntity(world.entities);

    world.transforms.set(playerId, { position: { x: 999, y: 999 }, rotationHull: 0, rotationTurret: 0 });
    world.transforms.set(enemyId, { position: { x: -999, y: -999 }, rotationHull: 0, rotationTurret: 0 });
    world.factions.set(playerId, { team: 'player' });
    world.factions.set(enemyId, { team: 'enemy' });

    const runBoundsSystem = createBoundsSystem(gameConfig);
    runBoundsSystem(world, 1 / 60);

    const playerPosition = world.transforms.get(playerId)!.position;
    const enemyPosition = world.transforms.get(enemyId)!.position;

    assert.isAtMost(playerPosition.x, gameConfig.worldBounds.maxX - gameConfig.worldBoundsPadding);
    assert.isAtMost(playerPosition.y, gameConfig.worldBounds.maxY - gameConfig.worldBoundsPadding);
    assert.isAtLeast(enemyPosition.x, gameConfig.worldBounds.minX + gameConfig.worldBoundsPadding);
    assert.isAtLeast(enemyPosition.y, gameConfig.worldBounds.minY + gameConfig.worldBoundsPadding);
  });
});
