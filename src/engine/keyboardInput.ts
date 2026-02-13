import type { InputSnapshot } from '../ecs/world';

export interface SimulatedInputState {
  aimWorld: { x: number; y: number } | null;
  firePrimary: boolean;
}

export interface KeyboardInputTracker {
  getSnapshot: () => InputSnapshot;
  setPointerWorld: (pointerWorld: { x: number; y: number } | null) => void;
  setSimulatedInput: (state: SimulatedInputState | null) => void;
  dispose: () => void;
}

const KEY_UP = ['KeyW', 'ArrowUp'];
const KEY_DOWN = ['KeyS', 'ArrowDown'];
const KEY_LEFT = ['KeyA', 'ArrowLeft'];
const KEY_RIGHT = ['KeyD', 'ArrowRight'];

const isAnyPressed = (pressed: Set<string>, keys: readonly string[]): boolean => keys.some((key) => pressed.has(key));

export const createKeyboardInputTracker = (eventTarget: Window): KeyboardInputTracker => {
  const pressed = new Set<string>();
  let pointerWorld: { x: number; y: number } | null = null;
  let firePrimary = false;
  let simulatedInput: SimulatedInputState | null = null;

  const onKeyDown = (event: KeyboardEvent): void => {
    pressed.add(event.code);
  };

  const onKeyUp = (event: KeyboardEvent): void => {
    pressed.delete(event.code);
  };

  const onMouseDown = (event: MouseEvent): void => {
    if (event.button === 0) {
      firePrimary = true;
    }
  };

  const onMouseUp = (event: MouseEvent): void => {
    if (event.button === 0) {
      firePrimary = false;
    }
  };

  eventTarget.addEventListener('keydown', onKeyDown);
  eventTarget.addEventListener('keyup', onKeyUp);
  eventTarget.addEventListener('mousedown', onMouseDown);
  eventTarget.addEventListener('mouseup', onMouseUp);

  return {
    getSnapshot: () => {
      const moveX = (isAnyPressed(pressed, KEY_RIGHT) ? 1 : 0) - (isAnyPressed(pressed, KEY_LEFT) ? 1 : 0);
      const moveY = (isAnyPressed(pressed, KEY_UP) ? 1 : 0) - (isAnyPressed(pressed, KEY_DOWN) ? 1 : 0);

      if (simulatedInput) {
        return {
          moveX,
          moveY,
          pointerX: simulatedInput.aimWorld?.x ?? null,
          pointerY: simulatedInput.aimWorld?.y ?? null,
          firePrimary: simulatedInput.firePrimary,
          aimWorldOverride: simulatedInput.aimWorld
        };
      }

      return {
        moveX,
        moveY,
        pointerX: pointerWorld?.x ?? null,
        pointerY: pointerWorld?.y ?? null,
        firePrimary,
        aimWorldOverride: null
      };
    },
    setPointerWorld: (value) => {
      pointerWorld = value;
    },
    setSimulatedInput: (state) => {
      simulatedInput = state;
    },
    dispose: () => {
      eventTarget.removeEventListener('keydown', onKeyDown);
      eventTarget.removeEventListener('keyup', onKeyUp);
      eventTarget.removeEventListener('mousedown', onMouseDown);
      eventTarget.removeEventListener('mouseup', onMouseUp);
      pressed.clear();
    }
  };
};
