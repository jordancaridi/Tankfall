export type EntityId = number;

export interface EntityRegistry {
  nextId: number;
}

export const createEntityRegistry = (): EntityRegistry => ({
  nextId: 1
});

export const createEntity = (registry: EntityRegistry): EntityId => {
  const id = registry.nextId;
  registry.nextId += 1;
  return id;
};
