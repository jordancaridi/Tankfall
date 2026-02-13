import { createEntityRegistry, type EntityRegistry, type EntityId } from './entity';
import type { AimComponent } from './components/AimComponent';
import type { CollisionRadiusComponent } from './components/CollisionRadiusComponent';
import type { DamageableComponent } from './components/DamageableComponent';
import type { InputIntentComponent } from './components/InputIntentComponent';
import type { KinematicsComponent } from './components/KinematicsComponent';
import type { ProjectileComponent } from './components/ProjectileComponent';
import type { ProjectileTag } from './components/ProjectileTag';
import type { TransformComponent, Vector2 } from './components/TransformComponent';
import type { WeaponComponent } from './components/WeaponComponent';
import type { ProjectilePool } from './projectilePool';

export interface InputSnapshot {
  moveX: number;
  moveY: number;
  pointerX: number | null;
  pointerY: number | null;
  firePrimary: boolean;
  aimWorldOverride: Vector2 | null;
}

export interface CameraTarget {
  x: number;
  y: number;
}

export interface DamageEvent {
  targetEntityId: EntityId;
  sourceEntityId: EntityId;
  amount: number;
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
  aims: ComponentStore<AimComponent>;
  weapons: ComponentStore<WeaponComponent>;
  projectiles: ComponentStore<ProjectileComponent>;
  projectileTags: ComponentStore<ProjectileTag>;
  damageables: ComponentStore<DamageableComponent>;
  collisionRadii: ComponentStore<CollisionRadiusComponent>;
  systems: RegisteredSystem[];
  adapters: SimulationAdapters;
  playerEntityId: EntityId | null;
  deadEntities: Set<EntityId>;
  damageQueue: DamageEvent[];
  inputState: InputSnapshot;
  projectilePool: ProjectilePool | null;
}

const createNoopAdapters = (): SimulationAdapters => ({
  readInputSnapshot: () => ({
    moveX: 0,
    moveY: 0,
    pointerX: null,
    pointerY: null,
    firePrimary: false,
    aimWorldOverride: null
  }),
  writeCameraTarget: () => undefined
});

export const createWorld = (adapters: Partial<SimulationAdapters> = {}): EcsWorld => {
  const defaults = createNoopAdapters();

  return {
    entities: createEntityRegistry(),
    transforms: new Map(),
    kinematics: new Map(),
    inputIntents: new Map(),
    aims: new Map(),
    weapons: new Map(),
    projectiles: new Map(),
    projectileTags: new Map(),
    damageables: new Map(),
    collisionRadii: new Map(),
    systems: [],
    adapters: {
      readInputSnapshot: adapters.readInputSnapshot ?? defaults.readInputSnapshot,
      writeCameraTarget: adapters.writeCameraTarget ?? defaults.writeCameraTarget
    },
    playerEntityId: null,
    deadEntities: new Set(),
    damageQueue: [],
    inputState: defaults.readInputSnapshot(),
    projectilePool: null
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
