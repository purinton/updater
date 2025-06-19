import { verifyServices } from '../src/verifyServices.mjs';
import { jest } from '@jest/globals';

describe('verifyServices', () => {
  it('returns immediately if all services active', async () => {
    const sshExec = jest.fn().mockResolvedValue([{ result: 'active\nactive', code: 0 }]);
    const log = { info: jest.fn(), error: jest.fn() };
    const sleepFn = jest.fn();
    await verifyServices('user@host', ['svc1', 'svc2'], 1, log, sshExec, sleepFn);
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining('All services are active'));
  });
  it('throws if a service fails to start', async () => {
    const sshExec = jest.fn().mockResolvedValue([{ result: 'failed\nactive', code: 0 }]);
    const log = { info: jest.fn(), error: jest.fn() };
    const sleepFn = jest.fn();
    await expect(verifyServices('user@host', ['svc1', 'svc2'], 1, log, sshExec, sleepFn)).rejects.toThrow('Service(s) not active');
  });
  it('retries if a service is activating, then succeeds', async () => {
    const log = { info: jest.fn(), error: jest.fn() };
    const sleepFn = jest.fn();
    let call = 0;
    const sshExec = jest.fn().mockImplementation(() => {
      call++;
      if (call === 1) return Promise.resolve([{ result: 'activating\nactive', code: 0 }]);
      return Promise.resolve([{ result: 'active\nactive', code: 0 }]);
    });
    await verifyServices('user@host', ['svc1', 'svc2'], 1, log, sshExec, sleepFn);
    expect(call).toBe(2);
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining('All services are active'));
  });
  it('retries on sshExec error, then succeeds', async () => {
    const log = { info: jest.fn(), error: jest.fn() };
    const sleepFn = jest.fn();
    let call = 0;
    const sshExec = jest.fn().mockImplementation(() => {
      call++;
      if (call === 1) return Promise.reject(new Error('fail'));
      return Promise.resolve([{ result: 'active\nactive', code: 0 }]);
    });
    await verifyServices('user@host', ['svc1', 'svc2'], 1, log, sshExec, sleepFn);
    expect(call).toBe(2);
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining('All services are active'));
  });
});
