import { main } from '../check-update.mjs';
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
        expect(mockSend).not.toHaveBeenCalled();
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
