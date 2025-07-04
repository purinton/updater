import { updateAndReboot } from '../src/updateAndReboot.mjs';
import { jest } from '@jest/globals';

describe('updateAndReboot', () => {
  it('calls sshExec with update/reboot command', async () => {
    const sshExec = jest.fn().mockResolvedValue([]);
    const log = { info: jest.fn(), error: jest.fn() };
    await updateAndReboot('user@host', log, sshExec);
    expect(sshExec).toHaveBeenCalledWith({ host: 'host', username: 'user', commands: ['yum clean all && yum -y update && reboot'] });
  });
});
