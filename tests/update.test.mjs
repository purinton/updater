import { jest } from '@jest/globals';
import {
  getOrderedServers,
  sleep,
  stopServices,
  updateAndReboot,
  waitForHostOffline,
  waitForHostOnline,
  isHostOnline,
  verifyServices
} from '../update.mjs';

describe('getOrderedServers', () => {
  it('orders servers by prefix and host', () => {
    const servers = {
      'user@cluster2': ['svc1'],
      'user@dev1': ['svc2'],
      'user@app1': ['svc3'],
      'user@cluster1': ['svc4'],
      'user@other': ['svc5']
    };
    const fsLib = {
      existsSync: jest.fn(() => true),
      readFileSync: jest.fn(() => JSON.stringify(servers))
    };
    const result = getOrderedServers('mock', fsLib);
    expect(result.map(s => s.host)).toEqual([
      'cluster1', 'cluster2', 'app1', 'dev1', 'other'
    ]);
  });
});

describe('sleep', () => {
  it('resolves after the given ms', async () => {
    const start = Date.now();
    await sleep(10);
    expect(Date.now() - start).toBeGreaterThanOrEqual(10);
  });
});

describe('stopServices', () => {
  it('calls sshExec with correct stop command', async () => {
    const sshExec = jest.fn().mockResolvedValue([]);
    const log = { info: jest.fn(), error: jest.fn() };
    await stopServices('user@host', ['svc1', 'svc2'], log, sshExec);
    expect(sshExec).toHaveBeenCalledWith({ host: 'host', username: 'user', commands: ['sudo systemctl stop svc1 svc2'] });
  });
  it('logs and skips if no services', async () => {
    const sshExec = jest.fn();
    const log = { info: jest.fn(), error: jest.fn() };
    await stopServices('user@host', [], log, sshExec);
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining('No services defined'));
    expect(sshExec).not.toHaveBeenCalled();
  });
});

describe('updateAndReboot', () => {
  it('calls sshExec with update/reboot command', async () => {
    const sshExec = jest.fn().mockResolvedValue([]);
    const log = { info: jest.fn(), error: jest.fn() };
    await updateAndReboot('user@host', log, sshExec);
    expect(sshExec).toHaveBeenCalledWith({ host: 'host', username: 'user', commands: ['yum -y update && reboot'] });
  });
});

describe('waitForHostOffline', () => {
  it('returns immediately if host is offline', async () => {
    const log = { info: jest.fn(), error: jest.fn() };
    const isHostOnlineFn = jest.fn().mockResolvedValue(false);
    const sleepFn = jest.fn();
    await waitForHostOffline('user@host', 22, 10, 1, log, sleepFn, isHostOnlineFn);
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining('is now offline'));
  });
});

describe('waitForHostOnline', () => {
  it('returns immediately if host is online', async () => {
    const log = { info: jest.fn(), error: jest.fn() };
    const isHostOnlineFn = jest.fn().mockResolvedValue(true);
    const sleepFn = jest.fn();
    await waitForHostOnline('user@host', 22, 10, 1, log, sleepFn, isHostOnlineFn);
    expect(log.info).toHaveBeenCalledWith(expect.stringContaining('is back online'));
  });
});

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
});
