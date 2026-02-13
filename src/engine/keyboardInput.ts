import type { InputSnapshot } from '../ecs/world';

export interface KeyboardInputTracker {
  getSnapshot: () => InputSnapshot;
  dispose: () => void;
}

const KEY_UP = ['KeyW', 'ArrowUp'];
const KEY_DOWN = ['KeyS', 'ArrowDown'];
const KEY_LEFT = ['KeyA', 'ArrowLeft'];
const KEY_RIGHT = ['KeyD', 'ArrowRight'];

const isAnyPressed = (pressed: Set<string>, keys: readonly string[]): boolean => keys.some((key) => pressed.has(key));

export const createKeyboardInputTracker = (eventTarget: Window): KeyboardInputTracker => {
  const pressed = new Set<string>();

  const onKeyDown = (event: KeyboardEvent): void => {
    pressed.add(event.code);
  };

  const onKeyUp = (event: KeyboardEvent): void => {
    pressed.delete(event.code);
  };

  eventTarget.addEventListener('keydown', onKeyDown);
  eventTarget.addEventListener('keyup', onKeyUp);

  return {
    getSnapshot: () => {
      const moveX = (isAnyPressed(pressed, KEY_RIGHT) ? 1 : 0) - (isAnyPressed(pressed, KEY_LEFT) ? 1 : 0);
      const moveY = (isAnyPressed(pressed, KEY_UP) ? 1 : 0) - (isAnyPressed(pressed, KEY_DOWN) ? 1 : 0);
      return { moveX, moveY };
    },
    dispose: () => {
      eventTarget.removeEventListener('keydown', onKeyDown);
      eventTarget.removeEventListener('keyup', onKeyUp);
      pressed.clear();
    }
  };
};
