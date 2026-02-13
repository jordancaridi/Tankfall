import { useSyncExternalStore } from 'react';
import { getUISnapshot, subscribeToUISnapshot } from './uiSnapshotStore';

const formatElapsed = (elapsedSeconds: number): string => {
  const totalSeconds = Math.max(0, Math.floor(elapsedSeconds));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export const HudRoot = (): JSX.Element => {
  const snapshot = useSyncExternalStore(subscribeToUISnapshot, getUISnapshot, getUISnapshot);

  return (
    <div className="hud-overlay" data-testid="hud-root">
      <div>HP: {Math.max(0, Math.round(snapshot.playerHp)) + ' / ' + Math.max(0, Math.round(snapshot.playerMaxHp))}</div>
      <div>Enemies: {snapshot.activeEnemyCount}</div>
      <div>Time: {formatElapsed(snapshot.elapsedTimeSec)}</div>
    </div>
  );
};
