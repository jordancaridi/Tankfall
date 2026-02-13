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
import type { RuntimeConfig } from './runtimeConfig';
import { createFixedTimestepLoop } from './fixedTimestepLoop';

export interface GameRuntime {
  dispose: () => void;
}

export const bootstrapGame = (canvas: HTMLCanvasElement, runtimeConfig: RuntimeConfig): GameRuntime => {
  window.__GAME_READY__ = false;

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
    updateSimulation: () => {
      // TODO(spec): wire ECS simulation updates here.
      void runtimeConfig.seed;
    },
    render: () => {
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
      window.removeEventListener('resize', handleResize);
      scene.dispose();
      engine.dispose();
      window.__GAME_READY__ = false;
    }
  };
};
