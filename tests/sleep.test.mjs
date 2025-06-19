import { sleep } from '../src/sleep.mjs';

describe('sleep', () => {
  it('resolves after the given ms', async () => {
    const start = Date.now();
    await sleep(10);
    expect(Date.now() - start).toBeGreaterThanOrEqual(10);
  });
});
