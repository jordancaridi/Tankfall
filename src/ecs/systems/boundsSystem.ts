import type { GameConfig } from '../../content/gameConfig';
import type { Vector2 } from '../components/TransformComponent';
import type { EcsWorld } from '../world';
import { queryEntities } from '../world';

export interface WorldBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export const clampPositionToBounds = (position: Vector2, bounds: WorldBounds, padding: number): Vector2 => {
  const safePadding = Math.max(0, padding);
  const minX = bounds.minX + safePadding;
  const maxX = bounds.maxX - safePadding;
  const minY = bounds.minY + safePadding;
  const maxY = bounds.maxY - safePadding;

  return {
    x: Math.min(Math.max(position.x, minX), maxX),
    y: Math.min(Math.max(position.y, minY), maxY)
  };
};

export const createBoundsSystem = (config: GameConfig) => {
  return (world: EcsWorld, _dtSeconds: number): void => {
    const entities = queryEntities(world.transforms, world.factions);

    entities.forEach((entityId) => {
      const faction = world.factions.get(entityId);
      const transform = world.transforms.get(entityId);
      if (!faction || !transform || (faction.team !== 'player' && faction.team !== 'enemy')) {
        return;
      }

      const clamped = clampPositionToBounds(transform.position, config.worldBounds, config.worldBoundsPadding);
      transform.position.x = clamped.x;
      transform.position.y = clamped.y;
    });
  };
};
