import { assert } from 'chai';
import { parseRuntimeConfig } from '../engine/runtimeConfig';

describe('parseRuntimeConfig', () => {
  it('parses seed and test mode from query params deterministically', () => {
    const config = parseRuntimeConfig('?seed=99&testMode=1');

    assert.equal(config.seed, 99);
    assert.isTrue(config.testMode);
  });

  it('falls back to defaults when params are missing', () => {
    const config = parseRuntimeConfig('');

    assert.equal(config.seed, 123);
    assert.isFalse(config.testMode);
  });
});
