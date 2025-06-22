import { checkUpdate } from '../src/checkUpdate.mjs';
import { jest } from '@jest/globals';

function createMockLogger() {
    const logs = { debug: [], info: [], error: [] };
    return {
        debug: jest.fn((msg, meta) => logs.debug.push({ msg, meta })),
        info: jest.fn((msg, meta) => logs.info.push({ msg, meta })),
        error: jest.fn((msg, meta) => logs.error.push({ msg, meta })),
        logs
    };
}

describe('checkUpdate', () => {
    test('logs and sends embed when updates are found', async () => {
        const log = createMockLogger();
        let sentMsg;
        const mockSshExec = jest.fn().mockResolvedValue([{ result: 'update1\nupdate2', code: 1 }]);
        const mockSend = jest.fn(async (msg) => { sentMsg = msg; });
        await checkUpdate({
            host: 'host1',
            username: 'user1',
            sshExecFn: mockSshExec,
            sendMsg: mockSend,
            log
        });
        expect(log.info).toHaveBeenCalledWith('Updates found', expect.objectContaining({ host: 'host1', code: 1 }));
        expect(sentMsg.body.embeds).toBeDefined();
        expect(sentMsg.body.embeds[0].title).toBe('Updates available on host1');
        expect(sentMsg.body.embeds[0].color).toBe(0xFFD700);
        expect(sentMsg.body.embeds[0].description).toContain('update1');
        expect(sentMsg.body.embeds[0].description).toContain('update2');
        expect(sentMsg.body.embeds[0].description.startsWith('```')).toBe(true);
        expect(sentMsg.body.embeds[0].description.endsWith('```')).toBe(true);
        expect(sentMsg.body.embeds[0].thumbnail).toBeDefined();
        expect(sentMsg.body.embeds[0].thumbnail.url).toBe('https://purinton.us/logos/purinton_64.png');
        expect(log.debug).toHaveBeenCalledWith('Checking updates', { host: 'host1' });
        expect(log.debug).toHaveBeenCalledWith('Update check result', { host: 'host1', code: 1 });
    });

    test('logs when no updates are found and does not send message', async () => {
        const log = createMockLogger();
        let sentMsg = null;
        const mockSshExec = jest.fn().mockResolvedValue([{ result: '', code: 0 }]);
        const mockSend = jest.fn(async (msg) => { sentMsg = msg; });
        await checkUpdate({
            host: 'host2',
            username: 'user2',
            sshExecFn: mockSshExec,
            sendMsg: mockSend,
            log
        });
        expect(log.info).toHaveBeenCalledWith('No updates found', expect.objectContaining({ host: 'host2' }));
        expect(sentMsg).toBeNull();
        expect(log.debug).toHaveBeenCalledWith('Checking updates', { host: 'host2' });
        expect(log.debug).toHaveBeenCalledWith('Update check result', { host: 'host2', code: 0 });
    });

    test('logs and sends error message on exception, includes message and stack', async () => {
        const log = createMockLogger();
        let sentMsg;
        const error = new Error('ssh fail');
        const mockSshExec = jest.fn().mockRejectedValue(error);
        const mockSend = jest.fn(async (msg) => { sentMsg = msg; });
        await checkUpdate({
            host: 'host3',
            username: 'user3',
            sshExecFn: mockSshExec,
            sendMsg: mockSend,
            log
        });
        expect(log.error).toHaveBeenCalledWith('Error checking updates', expect.objectContaining({
            host: 'host3',
            errorMessage: 'ssh fail',
            errorStack: error.stack,
            error
        }));
        expect(sentMsg.body.content).toContain('Error checking updates on user3@host3');
        expect(sentMsg.body.content).toContain('ssh fail');
    });
});
