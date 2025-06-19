import runUpdater from '../src/runUpdater.mjs';
import { jest } from '@jest/globals';

describe('runUpdater', () => {
  it('runs update process for all servers', async () => {
    const servers = [
      { userAtHost: 'user@host1', host: 'host1', services: ['svc1'], group: 'app' },
      { userAtHost: 'user@host2', host: 'host2', services: ['svc2'], group: 'dev' }
    ];
    const getOrderedServers = jest.fn(() => servers);
    const stopServices = jest.fn();
    const updateAndReboot = jest.fn();
    const waitForHostOffline = jest.fn();
    const waitForHostOnline = jest.fn();
    const verifyServices = jest.fn();
    const log = { info: jest.fn(), error: jest.fn() };
    const fsLib = {
      existsSync: jest.fn(() => true),
      readFileSync: jest.fn(() => JSON.stringify({}))
    };
    await runUpdater({
      log,
      serversFile: 'mock',
      fsLib,
      sshExec: jest.fn(),
      sleepFn: jest.fn(),
      getOrderedServers,
      stopServices,
      updateAndReboot,
      waitForHostOffline,
      waitForHostOnline,
      verifyServices
    });
    expect(stopServices).toHaveBeenCalledWith('user@host1', ['svc1'], log, expect.anything());
    expect(stopServices).toHaveBeenCalledWith('user@host2', ['svc2'], log, expect.anything());
  });
});
