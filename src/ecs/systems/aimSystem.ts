import type { KinematicsComponent } from '../components/KinematicsComponent';
import type { TransformComponent, Vector2 } from '../components/TransformComponent';
import type { EcsWorld } from '../world';
import { queryEntities } from '../world';

const TWO_PI = Math.PI * 2;

const wrapAngle = (angle: number): number => {
  let wrapped = angle % TWO_PI;
  if (wrapped > Math.PI) {
    wrapped -= TWO_PI;
  }
  if (wrapped < -Math.PI) {
    wrapped += TWO_PI;
  }
  return wrapped;
};

export const rotateToward = (current: number, target: number, maxStep: number): number => {
  const delta = wrapAngle(target - current);
  if (Math.abs(delta) <= maxStep) {
    return target;
  }

  return current + Math.sign(delta) * maxStep;
};

export const resolveAimWorld = (
  transform: TransformComponent,
  inputPointer: Vector2 | null,
  overrideAim: Vector2 | null
): Vector2 => {
  if (overrideAim) {
    return overrideAim;
  }

  if (inputPointer) {
    return inputPointer;
  }

  return {
    x: transform.position.x + Math.sin(transform.rotationTurret),
    y: transform.position.y + Math.cos(transform.rotationTurret)
  };
};

const getTargetAngle = (transform: TransformComponent, aimWorld: Vector2): number => {
  const dx = aimWorld.x - transform.position.x;
  const dy = aimWorld.y - transform.position.y;

  if (Math.hypot(dx, dy) <= 0.000001) {
    return transform.rotationTurret;
  }

  return Math.atan2(dx, dy);
};

const rotateTurret = (transform: TransformComponent, kinematics: KinematicsComponent, targetAngle: number, dtSeconds: number): void => {
  const maxStep = Math.max(0, kinematics.turnRateTurret) * dtSeconds;
  transform.rotationTurret = rotateToward(transform.rotationTurret, targetAngle, maxStep);
};

export const runAimSystem = (world: EcsWorld, dtSeconds: number): void => {
  const pointerWorld =
    world.inputState.pointerX === null || world.inputState.pointerY === null
      ? null
      : { x: world.inputState.pointerX, y: world.inputState.pointerY };

  const entities = queryEntities(world.aims, world.transforms, world.kinematics);

  entities.forEach((entityId) => {
    const aim = world.aims.get(entityId);
    const transform = world.transforms.get(entityId);
    const kinematics = world.kinematics.get(entityId);

    if (!aim || !transform || !kinematics) {
      return;
    }

    const aimWorld = resolveAimWorld(transform, pointerWorld, world.inputState.aimWorldOverride);
    aim.aimWorld.x = aimWorld.x;
    aim.aimWorld.y = aimWorld.y;

    const targetAngle = getTargetAngle(transform, aimWorld);
    rotateTurret(transform, kinematics, targetAngle, dtSeconds);
  });
};
