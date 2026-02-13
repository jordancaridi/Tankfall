export interface UISnapshot {
  playerHp: number;
  playerMaxHp: number;
  activeEnemyCount: number;
  elapsedTimeSec: number;
}

export const defaultUISnapshot: UISnapshot = {
  playerHp: 0,
  playerMaxHp: 0,
  activeEnemyCount: 0,
  elapsedTimeSec: 0
};
