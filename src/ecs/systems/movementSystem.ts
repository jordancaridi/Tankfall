import type { KinematicsComponent } from '../components/KinematicsComponent';
import type { InputIntentComponent } from '../components/InputIntentComponent';
import type { Vector2 } from '../components/TransformComponent';
import type { EcsWorld } from '../world';
import { queryEntities } from '../world';

export const normalizeIntent = (intent: InputIntentComponent): Vector2 => {
  const magnitude = Math.hypot(intent.moveX, intent.moveY);
  if (magnitude <= 0) {
    return { x: 0, y: 0 };
  }

  if (magnitude <= 1) {
    return { x: intent.moveX, y: intent.moveY };
  }

  return {
    x: intent.moveX / magnitude,
    y: intent.moveY / magnitude
  };
};

export const velocityFromIntent = (intent: InputIntentComponent, moveSpeed: number): Vector2 => {
  const normalized = normalizeIntent(intent);
  return {
    x: normalized.x * moveSpeed,
    y: normalized.y * moveSpeed
  };
};

const applyMovement = (position: Vector2, velocity: Vector2, dtSeconds: number): void => {
  position.x += velocity.x * dtSeconds;
  position.y += velocity.y * dtSeconds;
};

const updateVelocity = (kinematics: KinematicsComponent, intent: InputIntentComponent): void => {
  const velocity = velocityFromIntent(intent, kinematics.moveSpeed);
  kinematics.velocity.x = velocity.x;
  kinematics.velocity.y = velocity.y;
};

export const runMovementSystem = (world: EcsWorld, dtSeconds: number): void => {
  const movableEntities = queryEntities(world.kinematics, world.transforms, world.inputIntents);

  movableEntities.forEach((entityId) => {
    const transform = world.transforms.get(entityId);
    const kinematics = world.kinematics.get(entityId);
    const intent = world.inputIntents.get(entityId);

    if (!transform || !kinematics || !intent) {
      return;
    }

    updateVelocity(kinematics, intent);
    applyMovement(transform.position, kinematics.velocity, dtSeconds);
  });
};
