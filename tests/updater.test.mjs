import { jest } from '@jest/globals';
test('updater.mjs can be imported without error', async () => {
  process.env.LOG_LEVEL = 'none';
  await import('../updater.mjs');
  expect(true).toBe(true);
});