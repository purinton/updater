import { stopServices } from '../src/stopServices.mjs';
import { jest } from '@jest/globals';

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
