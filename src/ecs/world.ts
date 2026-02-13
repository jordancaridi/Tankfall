import { createEntityRegistry, type EntityRegistry, type EntityId } from './entity';
import type { InputIntentComponent } from './components/InputIntentComponent';
import type { KinematicsComponent } from './components/KinematicsComponent';
import type { TransformComponent } from './components/TransformComponent';

export interface InputSnapshot {
  moveX: number;
  moveY: number;
}

export interface CameraTarget {
  x: number;
  y: number;
}

export interface SimulationAdapters {
  readInputSnapshot: () => InputSnapshot;
  writeCameraTarget: (target: CameraTarget) => void;
}

export type ComponentStore<T> = Map<EntityId, T>;

export type WorldSystem = (world: EcsWorld, dtSeconds: number) => void;

export interface RegisteredSystem {
  name: string;
  run: WorldSystem;
}

export interface EcsWorld {
  entities: EntityRegistry;
  transforms: ComponentStore<TransformComponent>;
  kinematics: ComponentStore<KinematicsComponent>;
  inputIntents: ComponentStore<InputIntentComponent>;
  systems: RegisteredSystem[];
  adapters: SimulationAdapters;
  playerEntityId: EntityId | null;
}

const createNoopAdapters = (): SimulationAdapters => ({
  readInputSnapshot: () => ({ moveX: 0, moveY: 0 }),
  writeCameraTarget: () => undefined
});

export const createWorld = (adapters: Partial<SimulationAdapters> = {}): EcsWorld => {
  const defaults = createNoopAdapters();

  return {
    entities: createEntityRegistry(),
    transforms: new Map(),
    kinematics: new Map(),
    inputIntents: new Map(),
    systems: [],
    adapters: {
      readInputSnapshot: adapters.readInputSnapshot ?? defaults.readInputSnapshot,
      writeCameraTarget: adapters.writeCameraTarget ?? defaults.writeCameraTarget
    },
    playerEntityId: null
  };
};

export const registerSystem = (world: EcsWorld, name: string, run: WorldSystem): void => {
  world.systems.push({ name, run });
};

export const queryEntities = (sourceStore: ComponentStore<unknown>, ...stores: ComponentStore<unknown>[]): EntityId[] => {
  const entityIds = Array.from(sourceStore.keys()).sort((a, b) => a - b);

  return entityIds.filter((entityId) => stores.every((store) => store.has(entityId)));
};

export const updateSimulation = (world: EcsWorld, dtSeconds: number): void => {
  world.systems.forEach((system) => {
    system.run(world, dtSeconds);
  });
};
