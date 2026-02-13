import { defaultUISnapshot, type UISnapshot } from './uiSnapshot';

type SnapshotListener = () => void;

let currentSnapshot: UISnapshot = defaultUISnapshot;
const listeners = new Set<SnapshotListener>();

export const getUISnapshot = (): UISnapshot => currentSnapshot;

export const setUISnapshot = (nextSnapshot: UISnapshot): void => {
  currentSnapshot = nextSnapshot;
  listeners.forEach((listener) => listener());
};

export const subscribeToUISnapshot = (listener: SnapshotListener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
