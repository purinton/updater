import { runCheckForAllServers } from '../src/runCheckForAllServers.mjs';
import { jest } from '@jest/globals';

describe('runCheckForAllServers', () => {
  it('calls checkUpdate for each host', async () => {
    const servers = { 'user@host1': [], 'user@host2': [] };
    const parseServersFile = jest.fn(() => servers);
    const checkUpdate = jest.fn().mockResolvedValue();
    const log = { error: jest.fn(), debug: jest.fn(), info: jest.fn() };
    const fsLib = {
      existsSync: jest.fn(() => true),
      readFileSync: jest.fn(() => JSON.stringify(servers))
    };
    await runCheckForAllServers({ serversFile: 'mock', log, fsLib, parseServersFile, checkUpdate });
    expect(checkUpdate).toHaveBeenCalledTimes(2);
  });

  it('exits if no servers defined', async () => {
    const parseServersFile = jest.fn(() => ({}));
    const log = { error: jest.fn(), debug: jest.fn(), info: jest.fn() };
    const fsLib = {
      existsSync: jest.fn(() => true),
      readFileSync: jest.fn(() => JSON.stringify({}))
    };
    const oldExit = process.exit;
    process.exit = jest.fn(() => { throw new Error('exit'); });
    await expect(runCheckForAllServers({ serversFile: 'mock', log, fsLib, parseServersFile })).rejects.toThrow('exit');
    expect(log.error).toHaveBeenCalledWith('No servers defined in servers.json');
    process.exit = oldExit;
  });
});
