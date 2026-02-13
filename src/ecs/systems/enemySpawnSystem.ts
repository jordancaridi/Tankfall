import { getEnemyDefinition } from '../../content/enemies';
import type { GameConfig } from '../../content/gameConfig';
import { createEntity } from '../entity';
import type { SpawnDirectorStateComponent } from '../components/SpawnDirectorStateComponent';
import type { EcsWorld } from '../world';

const DIRECTOR_ENTITY_ID = 0;
const SPAWN_RADIUS = 38;

export interface DifficultyMultipliers {
  hp: number;
  damage: number;
  spawnRate: number;
}

const normalizeSeed = (seed: number): number => {
  const safe = Math.floor(seed) >>> 0;
  return safe === 0 ? 1 : safe;
};

export const stepRng = (state: number): number => ((state * 1664525 + 1013904223) >>> 0) || 1;

export const randomFloat01 = (state: number): { value: number; nextState: number } => {
  const nextState = stepRng(state);
  return { value: nextState / 0xffffffff, nextState };
};

export const computeDifficultyMultipliers = (elapsedSec: number, config: GameConfig): DifficultyMultipliers => {
  const elapsedMin = Math.max(0, elapsedSec) / 60;
  const timeScale = config.director.difficulty.timeScale;

  return {
    hp: 1 + elapsedMin * timeScale.hpMultPerMin,
    damage: 1 + elapsedMin * timeScale.damageMultPerMin,
    spawnRate: 1 + elapsedMin * timeScale.spawnRateMultPerMin
  };
};

export const selectWeightedEnemy = (
  archetypeWeights: GameConfig['director']['archetypeWeights'],
  rngState: number
): { enemyId: string; nextState: number } => {
  const totalWeight = archetypeWeights.reduce((sum, item) => sum + Math.max(0, item.weight), 0);
  if (totalWeight <= 0) {
    throw new Error('director.archetypeWeights must have positive total weight');
  }

  const roll = randomFloat01(rngState);
  const target = roll.value * totalWeight;
  let running = 0;

  for (const item of archetypeWeights) {
    running += Math.max(0, item.weight);
    if (target <= running) {
      return { enemyId: item.enemyId, nextState: roll.nextState };
    }
  }

  return { enemyId: archetypeWeights[archetypeWeights.length - 1].enemyId, nextState: roll.nextState };
};

const getOrCreateDirectorState = (world: EcsWorld, seed: number): SpawnDirectorStateComponent => {
  let state = world.spawnDirectorStates.get(DIRECTOR_ENTITY_ID);
  if (!state) {
    state = {
      elapsedSec: 0,
      spawnAccumulator: 0,
      intervalAccumulator: 0,
      nextSpawnId: 1,
      rngState: normalizeSeed(seed)
    };
    world.spawnDirectorStates.set(DIRECTOR_ENTITY_ID, state);
  }

  return state;
};

const countActiveEnemies = (world: EcsWorld): number =>
  Array.from(world.factions.entries()).filter(([entityId, faction]) => {
    if (faction.team !== 'enemy') {
      return false;
    }

    const hp = world.damageables.get(entityId)?.hp ?? 0;
    return hp > 0 && !world.deadEntities.has(entityId);
  }).length;

const spawnEnemy = (
  world: EcsWorld,
  config: GameConfig,
  directorState: SpawnDirectorStateComponent,
  multipliers: DifficultyMultipliers
): void => {
  const selection = selectWeightedEnemy(config.director.archetypeWeights, directorState.rngState);
  directorState.rngState = selection.nextState;

  const definition = getEnemyDefinition(selection.enemyId);
  const angleRoll = randomFloat01(directorState.rngState);
  directorState.rngState = angleRoll.nextState;

  const spawnAngle = angleRoll.value * Math.PI * 2;
  const spawnX = Math.cos(spawnAngle) * SPAWN_RADIUS;
  const spawnY = Math.sin(spawnAngle) * SPAWN_RADIUS;

  const enemyId = createEntity(world.entities);
  world.transforms.set(enemyId, {
    position: { x: spawnX, y: spawnY },
    rotationHull: 0,
    rotationTurret: 0
  });
  world.kinematics.set(enemyId, {
    velocity: { x: 0, y: 0 },
    moveSpeed: definition.moveSpeed,
    turnRateHull: definition.turnRate,
    turnRateTurret: 0
  });
  world.inputIntents.set(enemyId, { moveX: 0, moveY: 0 });

  const scaledHp = Math.max(1, Math.round(definition.hp * multipliers.hp));
  world.damageables.set(enemyId, { hp: scaledHp, maxHp: scaledHp });
  world.collisionRadii.set(enemyId, { radius: definition.collisionRadius });
  world.factions.set(enemyId, { team: 'enemy' });
  world.aiStates.set(enemyId, { state: 'acquire' });
  world.enemyArchetypes.set(enemyId, { enemyId: definition.id });
  world.contactDamages.set(enemyId, {
    damagePerHit: definition.contactDamage * multipliers.damage,
    hitCooldown: definition.contactCooldown,
    cooldownRemaining: 0
  });

  directorState.nextSpawnId += 1;
};

export const createEnemySpawnSystem = (config: GameConfig, seed: number) => {
  if (config.director.eliteEnabled) {
    throw new Error('Milestone 2A requires eliteEnabled=false');
  }

  return (world: EcsWorld, dtSeconds: number): void => {
    const state = getOrCreateDirectorState(world, seed);
    state.elapsedSec += dtSeconds;

    const multipliers = computeDifficultyMultipliers(state.elapsedSec, config);
    const activeEnemies = countActiveEnemies(world);
    if (activeEnemies >= config.director.maxActiveEnemies) {
      return;
    }

    state.spawnAccumulator += dtSeconds * config.director.spawnBudgetPerSec * multipliers.spawnRate;
    state.intervalAccumulator += dtSeconds;

    const canSpawnByBudget = (): boolean => state.spawnAccumulator >= 1;
    const canSpawnByInterval = (): boolean =>
      config.director.spawnIntervalSec <= 0 || state.intervalAccumulator >= config.director.spawnIntervalSec;

    let spawnCount = 0;
    while (
      canSpawnByBudget() &&
      canSpawnByInterval() &&
      activeEnemies + spawnCount < config.director.maxActiveEnemies
    ) {
      spawnEnemy(world, config, state, multipliers);
      spawnCount += 1;
      state.spawnAccumulator -= 1;
      if (config.director.spawnIntervalSec > 0) {
        state.intervalAccumulator -= config.director.spawnIntervalSec;
      }
    }
  };
};
