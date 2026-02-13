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
import { createEntity } from '../ecs/entity';
import type { InputIntentComponent } from '../ecs/components/InputIntentComponent';
import type { KinematicsComponent } from '../ecs/components/KinematicsComponent';
import type { TransformComponent } from '../ecs/components/TransformComponent';
import { runCameraFollowSystem } from '../ecs/systems/cameraFollowSystem';
import { runInputSystem } from '../ecs/systems/inputSystem';
import { runMovementSystem } from '../ecs/systems/movementSystem';
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
} => ({
  transform: {
    position: { x: 0, y: 0 },
    rotationHull: 0,
    rotationTurret: 0
  },
  kinematics: {
    velocity: { x: 0, y: 0 },
    moveSpeed: 10,
    turnRateHull: 0
  },
  inputIntent: {
    moveX: 0,
    moveY: 0
  }
});

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

  registerSystem(world, 'InputSystem', runInputSystem);
  registerSystem(world, 'MovementSystem', runMovementSystem);
  registerSystem(world, 'CameraFollowSystem', runCameraFollowSystem);

  const engine = new Engine(canvas, true, {
    adaptToDeviceRatio: true,
    antialias: true
  });

  const scene = new Scene(engine);
  scene.clearColor.set(0.02, 0.03, 0.08, 1.0);

  const camera = new ArcRotateCamera('iso-camera', Math.PI / 4, Math.PI / 3, 40, Vector3.Zero(), scene);
  camera.attachControl(canvas, true);
  camera.wheelDeltaPercentage = 0.01;

  new HemisphericLight('sun-light', new Vector3(0.2, 1, 0.2), scene).intensity = 0.95;

  const ground = MeshBuilder.CreateGround('ground', { width: 80, height: 80 }, scene);
  const groundMaterial = new StandardMaterial('ground-mat', scene);
  groundMaterial.diffuseColor = new Color3(0.1, 0.3, 0.16);
  ground.material = groundMaterial;

  const tankBody = MeshBuilder.CreateBox('tank-placeholder', { width: 2.4, depth: 3.2, height: 1.1 }, scene);
  tankBody.position.y = 0.65;
  const tankMaterial = new StandardMaterial('tank-mat', scene);
  tankMaterial.diffuseColor = runtimeConfig.testMode ? new Color3(0.2, 0.45, 0.88) : new Color3(0.28, 0.44, 0.33);
  tankBody.material = tankMaterial;

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
      }

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
      window.removeEventListener('resize', handleResize);
      scene.dispose();
      engine.dispose();
      window.__GAME_READY__ = false;
    }
  };
};
