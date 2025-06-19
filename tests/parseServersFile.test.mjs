import { parseServersFile } from '../src/parseServersFile.mjs';
import { jest } from '@jest/globals';

describe('parseServersFile', () => {
  it('parses valid servers file', () => {
    const servers = { 'user@host': ['svc'] };
    const fsLib = {
      existsSync: jest.fn(() => true),
      readFileSync: jest.fn(() => JSON.stringify(servers))
    };
    const log = { error: jest.fn() };
    expect(parseServersFile('mock', fsLib, log)).toEqual(servers);
  });

  it('exits if file does not exist', () => {
    const fsLib = {
      existsSync: jest.fn(() => false),
      readFileSync: jest.fn()
    };
    const log = { error: jest.fn() };
    const oldExit = process.exit;
    process.exit = jest.fn(() => { throw new Error('exit'); });
    expect(() => parseServersFile('missing.json', fsLib, log)).toThrow('exit');
    expect(log.error).toHaveBeenCalledWith('Servers file not found: missing.json');
    process.exit = oldExit;
  });

  it('exits if file is invalid JSON', () => {
    const fsLib = {
      existsSync: jest.fn(() => true),
      readFileSync: jest.fn(() => 'not-json')
    };
    const log = { error: jest.fn() };
    const oldExit = process.exit;
    process.exit = jest.fn(() => { throw new Error('exit'); });
    expect(() => parseServersFile('bad.json', fsLib, log)).toThrow('exit');
    expect(log.error).toHaveBeenCalledWith('Invalid JSON in servers file: bad.json');
    process.exit = oldExit;
  });
});
