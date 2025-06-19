import { waitForHostOnline } from '../src/waitForHostOnline.mjs';
import { jest } from '@jest/globals';

describe('waitForHostOnline', () => {
  it('returns immediately if host is online', async () => {
    const log = { info: jest.fn(), error: jest.fn() };
    const isHostOnlineFn = jest.fn().mockResolvedValue(true);
    const sleepFn = jest.fn();
    await waitForHostOnline('user@host', 22, 10, 1, log, sleepFn, isHostOnlineFn);
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining('is back online'));
  });

  it('throws if timeout is reached', async () => {
    const log = { info: jest.fn(), error: jest.fn() };
    const isHostOnlineFn = jest.fn().mockResolvedValue(false);
    const sleepFn = jest.fn();
    await expect(waitForHostOnline('user@host', 22, 0.01, 0.001, log, sleepFn, isHostOnlineFn)).rejects.toThrow('Timeout waiting for user@host to come back online.');
  });

  it('retries until host is online', async () => {
    const log = { info: jest.fn(), error: jest.fn() };
    let attempts = 0;
    const isHostOnlineFn = jest.fn().mockImplementation(() => {
      attempts++;
      return Promise.resolve(attempts === 3);
    });
    const sleepFn = jest.fn();
    await waitForHostOnline('user@host', 22, 1, 0.001, log, sleepFn, isHostOnlineFn);
    expect(attempts).toBe(3);
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining('is back online'));
  });
});
