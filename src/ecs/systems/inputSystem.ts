import type { EcsWorld, InputSnapshot } from '../world';

const clamp = (value: number): number => Math.max(-1, Math.min(1, value));

const normalizeInput = (snapshot: InputSnapshot): InputSnapshot => ({
  moveX: clamp(snapshot.moveX),
  moveY: clamp(snapshot.moveY),
  pointerX: snapshot.pointerX,
  pointerY: snapshot.pointerY,
  firePrimary: snapshot.firePrimary,
  aimWorldOverride: snapshot.aimWorldOverride
});

export const runInputSystem = (world: EcsWorld): void => {
  const snapshot = normalizeInput(world.adapters.readInputSnapshot());
  world.inputState = snapshot;

  if (world.playerEntityId === null) {
    return;
  }

  const playerIntent = world.inputIntents.get(world.playerEntityId);
  if (!playerIntent) {
    return;
  }

  playerIntent.moveX = snapshot.moveX;
  playerIntent.moveY = snapshot.moveY;
};
