import type { EcsWorld } from '../world';

const clamp = (value: number): number => Math.max(-1, Math.min(1, value));

export const runInputSystem = (world: EcsWorld): void => {
  const snapshot = world.adapters.readInputSnapshot();
  const moveX = clamp(snapshot.moveX);
  const moveY = clamp(snapshot.moveY);

  world.inputIntents.forEach((intent) => {
    intent.moveX = moveX;
    intent.moveY = moveY;
  });
};
