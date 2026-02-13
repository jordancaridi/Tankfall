import {
  ArcRotateCamera,
  Color3,
  Engine,
  HemisphericLight,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Vector3
} from '@babylonjs/core';
import '@babylonjs/loaders';
import { gameConfig } from '../content/gameConfig';
import { createEntity } from '../ecs/entity';
import { createProjectilePool } from '../ecs/projectilePool';
import type { AimComponent } from '../ecs/components/AimComponent';
import type { InputIntentComponent } from '../ecs/components/InputIntentComponent';
import type { KinematicsComponent } from '../ecs/components/KinematicsComponent';
import type { TransformComponent } from '../ecs/components/TransformComponent';
import type { WeaponComponent } from '../ecs/components/WeaponComponent';
import { runAimSystem } from '../ecs/systems/aimSystem';
import { runCameraFollowSystem } from '../ecs/systems/cameraFollowSystem';
import { runCollisionSystem } from '../ecs/systems/collisionSystem';
import { runContactDamageSystem } from '../ecs/systems/contactDamageSystem';
import { runDamageSystem } from '../ecs/systems/damageSystem';
import { runAISystem } from '../ecs/systems/aiSystem';
import { createEnemySpawnSystem } from '../ecs/systems/enemySpawnSystem';
import { runInputSystem } from '../ecs/systems/inputSystem';
import { runMovementSystem } from '../ecs/systems/movementSystem';
import { runProjectileSystem } from '../ecs/systems/projectileSystem';
import { runSteeringSystem } from '../ecs/systems/steeringSystem';
import { runTargetingSystem } from '../ecs/systems/targetingSystem';
import { runWeaponSystem } from '../ecs/systems/weaponSystem';
import { createWorld, registerSystem, updateSimulation } from '../ecs/world';
import { createFixedTimestepLoop } from './fixedTimestepLoop';
import { createKeyboardInputTracker } from './keyboardInput';
import type { RuntimeConfig } from './runtimeConfig';

export interface GameRuntime {
  dispose: () => void;
}

interface CameraTargetState {
  x: number;
  y: number;
}

const createPlayerComponents = (): {
  transform: TransformComponent;
  kinematics: KinematicsComponent;
  inputIntent: InputIntentComponent;
  aim: AimComponent;
  weapon: WeaponComponent;
} => ({
  transform: {
    position: { x: 0, y: 0 },
    rotationHull: 0,
    rotationTurret: 0
  },
  kinematics: {
    velocity: { x: 0, y: 0 },
    moveSpeed: 10,
    turnRateHull: 0,
    turnRateTurret: 16
  },
  inputIntent: {
    moveX: 0,
    moveY: 0
  },
  aim: {
    aimWorld: { x: 0, y: 1 }
  },
  weapon: {
    weaponIdPrimary: 'player_cannon_m1',
    cooldownPrimary: 0
  }
});

const getGroundIntersection = (scene: Scene, camera: ArcRotateCamera, x: number, y: number): { x: number; y: number } | null => {
  const ray = scene.createPickingRay(x, y, null, camera);
  const denominator = ray.direction.y;

  if (Math.abs(denominator) <= 0.000001) {
    return null;
  }

  const t = -ray.origin.y / denominator;
  if (t < 0) {
    return null;
  }

  const point = ray.origin.add(ray.direction.scale(t));
  return { x: point.x, y: point.z };
};

export const bootstrapGame = (canvas: HTMLCanvasElement, runtimeConfig: RuntimeConfig): GameRuntime => {
  window.__GAME_READY__ = false;

  const keyboardInput = createKeyboardInputTracker(window);
  const cameraTargetState: CameraTargetState = { x: 0, y: 0 };

  const world = createWorld({
    readInputSnapshot: keyboardInput.getSnapshot,
    writeCameraTarget: (target) => {
      cameraTargetState.x = target.x;
      cameraTargetState.y = target.y;
    }
  });

  const playerEntityId = createEntity(world.entities);
  world.playerEntityId = playerEntityId;

  const player = createPlayerComponents();
  world.transforms.set(playerEntityId, player.transform);
  world.kinematics.set(playerEntityId, player.kinematics);
  world.inputIntents.set(playerEntityId, player.inputIntent);
  world.aims.set(playerEntityId, player.aim);
  world.weapons.set(playerEntityId, player.weapon);
  world.damageables.set(playerEntityId, { hp: 100, maxHp: 100 });
  world.collisionRadii.set(playerEntityId, { radius: 1.2 });
  world.factions.set(playerEntityId, { team: 'player' });

  world.projectilePool = createProjectilePool(world, 64);

  const runEnemySpawnSystem = createEnemySpawnSystem(gameConfig, runtimeConfig.testMode);

  registerSystem(world, 'InputSystem', runInputSystem);
  registerSystem(world, 'EnemySpawnSystem', runEnemySpawnSystem);
  registerSystem(world, 'TargetingSystem', runTargetingSystem);
  registerSystem(world, 'AISystem', runAISystem);
  registerSystem(world, 'SteeringSystem', runSteeringSystem);
  registerSystem(world, 'AimSystem', runAimSystem);
  registerSystem(world, 'MovementSystem', runMovementSystem);
  registerSystem(world, 'WeaponSystem', runWeaponSystem);
  registerSystem(world, 'ProjectileSystem', runProjectileSystem);
  registerSystem(world, 'CollisionSystem', runCollisionSystem);
  registerSystem(world, 'ContactDamageSystem', runContactDamageSystem);
  registerSystem(world, 'DamageSystem', runDamageSystem);
  registerSystem(world, 'CameraFollowSystem', runCameraFollowSystem);

  const engine = new Engine(canvas, true, {
    adaptToDeviceRatio: true,
    antialias: true
  });

  const scene = new Scene(engine);
  scene.clearColor.set(0.02, 0.03, 0.08, 1.0);

  const camera = new ArcRotateCamera('iso-camera', Math.PI / 4, Math.PI / 3, 40, Vector3.Zero(), scene);
  camera.wheelDeltaPercentage = 0.01;

  new HemisphericLight('sun-light', new Vector3(0.2, 1, 0.2), scene).intensity = 0.95;

  const ground = MeshBuilder.CreateGround('ground', { width: 80, height: 80 }, scene);
  const groundMaterial = new StandardMaterial('ground-mat', scene);
  groundMaterial.diffuseColor = new Color3(0.1, 0.3, 0.16);
  ground.material = groundMaterial;

  const tankBody = MeshBuilder.CreateBox('tank-placeholder', { width: 2.4, depth: 3.2, height: 1.1 }, scene);
  tankBody.position.y = 0.65;
  const turret = MeshBuilder.CreateBox('tank-turret', { width: 1.2, depth: 1.8, height: 0.7 }, scene);
  turret.position.y = 1.3;
  const barrel = MeshBuilder.CreateBox('tank-barrel', { width: 0.3, depth: 2.4, height: 0.3 }, scene);
  barrel.parent = turret;
  barrel.position.z = 1.6;
  barrel.position.y = 0.05;
  const tankMaterial = new StandardMaterial('tank-mat', scene);
  tankMaterial.diffuseColor = runtimeConfig.testMode ? new Color3(0.2, 0.45, 0.88) : new Color3(0.28, 0.44, 0.33);
  tankBody.material = tankMaterial;
  turret.material = tankMaterial;
  barrel.material = tankMaterial;

  const enemyMeshes = new Map<number, ReturnType<typeof MeshBuilder.CreateCylinder>>();
  const enemyMaterial = new StandardMaterial('enemy-mat', scene);
  enemyMaterial.diffuseColor = new Color3(0.82, 0.18, 0.18);

  const projectileMeshes = new Map<number, ReturnType<typeof MeshBuilder.CreateSphere>>();
  world.projectiles.forEach((_, entityId) => {
    const projectileMesh = MeshBuilder.CreateSphere(`projectile-${entityId}`, { diameter: 0.4 }, scene);
    projectileMesh.isVisible = false;
    const projectileMaterial = new StandardMaterial(`projectile-mat-${entityId}`, scene);
    projectileMaterial.diffuseColor = new Color3(0.95, 0.8, 0.25);
    projectileMesh.material = projectileMaterial;
    projectileMeshes.set(entityId, projectileMesh);
  });

  const onPointerMove = (event: PointerEvent): void => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    keyboardInput.setPointerWorld(getGroundIntersection(scene, camera, x, y));
  };

  window.addEventListener('pointermove', onPointerMove);

  const loop = createFixedTimestepLoop({
    updateSimulation: (fixedDtSeconds) => {
      updateSimulation(world, fixedDtSeconds);
      void runtimeConfig.seed;
    },
    render: () => {
      const transform = world.playerEntityId === null ? undefined : world.transforms.get(world.playerEntityId);
      if (transform) {
        tankBody.position.x = transform.position.x;
        tankBody.position.z = transform.position.y;
        turret.position.x = transform.position.x;
        turret.position.z = transform.position.y;
        turret.rotation.y = transform.rotationTurret;
      }

      world.factions.forEach((faction, entityId) => {
        if (faction.team !== 'enemy') {
          return;
        }

        const transformEnemy = world.transforms.get(entityId);
        if (!transformEnemy) {
          return;
        }

        let enemyMesh = enemyMeshes.get(entityId);
        if (!enemyMesh) {
          enemyMesh = MeshBuilder.CreateCylinder(`enemy-${entityId}`, { diameter: 1.8, height: 1.4 }, scene);
          enemyMesh.material = enemyMaterial;
          enemyMesh.position.y = 0.7;
          enemyMeshes.set(entityId, enemyMesh);
        }

        enemyMesh.position.x = transformEnemy.position.x;
        enemyMesh.position.z = transformEnemy.position.y;
      });

      world.projectiles.forEach((projectile, entityId) => {
        const mesh = projectileMeshes.get(entityId);
        const projectileTransform = world.transforms.get(entityId);
        if (!mesh || !projectileTransform || !projectile.active) {
          if (mesh) {
            mesh.isVisible = false;
          }
          return;
        }

        mesh.isVisible = true;
        mesh.position.x = projectileTransform.position.x;
        mesh.position.y = 1.35;
        mesh.position.z = projectileTransform.position.y;
      });

      camera.setTarget(new Vector3(cameraTargetState.x, 0, cameraTargetState.y));
      scene.render();
    },
    onFirstRender: () => {
      window.__GAME_READY__ = true;
    }
  });

  const handleResize = (): void => {
    engine.resize();
  };

  window.addEventListener('resize', handleResize);

  return {
    dispose: () => {
      loop.stop();
      keyboardInput.dispose();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', handleResize);
      scene.dispose();
      engine.dispose();
      window.__GAME_READY__ = false;
    }
  };
};
