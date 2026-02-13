export type EnemyAIState = 'acquire' | 'pursue' | 'attack' | 'cooldown';

export interface AIStateComponent {
  state: EnemyAIState;
}
