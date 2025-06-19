import { jest } from '@jest/globals';
import { checkUpdate, main } from '../check-update.mjs';

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
    test('logs and sends message when updates are found', async () => {
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
        expect(log.info).toHaveBeenCalledWith('Updates found', expect.objectContaining({ host: 'host1', username: 'user1', code: 1 }));
        expect(sentMsg.body.content).toContain('Updates found on user1@host1');
        expect(log.debug).toHaveBeenCalledWith('Checking updates', { host: 'host1', username: 'user1' });
        expect(log.debug).toHaveBeenCalledWith('Update check result', { host: 'host1', username: 'user1', code: 1 });
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
        expect(log.info).toHaveBeenCalledWith('No updates found', expect.objectContaining({ host: 'host2', username: 'user2' }));
        expect(sentMsg).toBeNull();
        expect(log.debug).toHaveBeenCalledWith('Checking updates', { host: 'host2', username: 'user2' });
        expect(log.debug).toHaveBeenCalledWith('Update check result', { host: 'host2', username: 'user2', code: 0 });
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
        // Check log.error called with errorMessage and errorStack
        expect(log.error).toHaveBeenCalledWith('Error checking updates', expect.objectContaining({
            host: 'host3',
            username: 'user3',
            errorMessage: 'ssh fail',
            errorStack: error.stack,
            error
        }));
        expect(sentMsg.body.content).toContain('Error checking updates on user3@host3');
        expect(sentMsg.body.content).toContain('ssh fail');
    });
});

describe('main', () => {
    test('calls checkUpdate for each host in servers.json', async () => {
        const log = createMockLogger();
        const fakeServers = {
            'userA@hostA': [],
            'userB@hostB': []
        };
        const mockFs = {
            existsSync: jest.fn(() => true),
            readFileSync: jest.fn(() => JSON.stringify(fakeServers))
        };
        const mockSshExec = jest.fn().mockResolvedValue([{ result: '', code: 0 }]);
        const mockSend = jest.fn();
        await main({
            serversFile: 'fake.json',
            sshExecFn: mockSshExec,
            sendMsg: mockSend,
            log,
            fsLib: mockFs
        });
        expect(mockFs.existsSync).toHaveBeenCalledWith('fake.json');
        expect(mockFs.readFileSync).toHaveBeenCalledWith('fake.json', 'utf8');
        expect(mockSshExec).toHaveBeenCalledTimes(2);
        expect(mockSend).not.toHaveBeenCalled(); // No updates, so no sendMsg
    });

    test('exits if servers file does not exist', async () => {
        const log = createMockLogger();
        const mockFs = {
            existsSync: jest.fn(() => false),
            readFileSync: jest.fn(() => '')
        };
        const oldExit = process.exit;
        process.exit = jest.fn(() => { throw new Error('exit'); });
        try {
            await main({ serversFile: 'missing.json', log, fsLib: mockFs });
        } catch { }
        expect(process.exit).toHaveBeenCalled();
        expect(log.error).toHaveBeenCalledWith('Servers file not found: missing.json');
        process.exit = oldExit;
    });

    test('exits if servers file is invalid JSON', async () => {
        const log = createMockLogger();
        const mockFs = {
            existsSync: jest.fn(() => true),
            readFileSync: jest.fn(() => 'not-json')
        };
        const oldExit = process.exit;
        process.exit = jest.fn(() => { throw new Error('exit'); });
        try {
            await main({ serversFile: 'bad.json', log, fsLib: mockFs });
        } catch { }
        expect(process.exit).toHaveBeenCalled();
        expect(log.error).toHaveBeenCalledWith('Invalid JSON in servers file: bad.json');
        process.exit = oldExit;
    });

    test('exits if servers.json is empty', async () => {
        const log = createMockLogger();
        const mockFs = {
            existsSync: jest.fn(() => true),
            readFileSync: jest.fn(() => JSON.stringify({}))
        };
        const oldExit = process.exit;
        process.exit = jest.fn(() => { throw new Error('exit'); });
        try {
            await main({ serversFile: 'empty.json', log, fsLib: mockFs });
        } catch { }
        expect(process.exit).toHaveBeenCalled();
        expect(log.error).toHaveBeenCalledWith('No servers defined in servers.json');
        process.exit = oldExit;
    });
});
