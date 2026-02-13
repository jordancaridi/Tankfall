export interface RuntimeConfig {
  seed: number;
  testMode: boolean;
}

const DEFAULT_SEED = 123;

export const parseRuntimeConfig = (search: string): RuntimeConfig => {
  const params = new URLSearchParams(search);
  const seedRaw = params.get('seed');
  const seedParam = seedRaw === null ? Number.NaN : Number(seedRaw);

  return {
    seed: Number.isFinite(seedParam) ? seedParam : DEFAULT_SEED,
    testMode: params.get('testMode') === '1'
  };
};
