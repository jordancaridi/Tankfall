import { assert } from 'chai';
import { createEntity } from '../ecs/entity';
import { runMovementSystem, velocityFromIntent } from '../ecs/systems/movementSystem';
import { createWorld } from '../ecs/world';

describe('MovementSystem', () => {
  it('scales movement by dt', () => {
    const world = createWorld();
    const entityId = createEntity(world.entities);

    world.transforms.set(entityId, {
      position: { x: 0, y: 0 },
      rotationHull: 0,
      rotationTurret: 0
    });

    world.kinematics.set(entityId, {
      velocity: { x: 0, y: 0 },
      moveSpeed: 6,
      turnRateHull: 0
    });

    world.inputIntents.set(entityId, { moveX: 1, moveY: 0 });

    runMovementSystem(world, 0.5);

    const transform = world.transforms.get(entityId);
    const kinematics = world.kinematics.get(entityId);

    assert.exists(transform);
    assert.exists(kinematics);
    assert.closeTo(transform!.position.x, 3, 0.000001);
    assert.closeTo(transform!.position.y, 0, 0.000001);
    assert.closeTo(kinematics!.velocity.x, 6, 0.000001);
    assert.closeTo(kinematics!.velocity.y, 0, 0.000001);
  });

  it('normalizes diagonal movement to keep speed deterministic', () => {
    const velocity = velocityFromIntent({ moveX: 1, moveY: 1 }, 10);
    const magnitude = Math.hypot(velocity.x, velocity.y);

    assert.closeTo(magnitude, 10, 0.000001);
    assert.closeTo(velocity.x, 7.0710678118654755, 0.000001);
    assert.closeTo(velocity.y, 7.0710678118654755, 0.000001);
  });

  it('sets zero velocity when input intent is zero', () => {
    const world = createWorld();
    const entityId = createEntity(world.entities);

    world.transforms.set(entityId, {
      position: { x: 5, y: -2 },
      rotationHull: 0,
      rotationTurret: 0
    });

    world.kinematics.set(entityId, {
      velocity: { x: 99, y: -21 },
      moveSpeed: 8,
      turnRateHull: 0
    });

    world.inputIntents.set(entityId, { moveX: 0, moveY: 0 });

    runMovementSystem(world, 1 / 60);

    const transform = world.transforms.get(entityId);
    const kinematics = world.kinematics.get(entityId);

    assert.exists(transform);
    assert.exists(kinematics);
    assert.closeTo(kinematics!.velocity.x, 0, 0.000001);
    assert.closeTo(kinematics!.velocity.y, 0, 0.000001);
    assert.closeTo(transform!.position.x, 5, 0.000001);
    assert.closeTo(transform!.position.y, -2, 0.000001);
  });
});
