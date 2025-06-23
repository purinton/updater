import { isHostOnline } from '../src/isHostOnline.mjs';
import { jest } from '@jest/globals';
import dns from 'dns';
import net from 'net';

describe('isHostOnline', () => {
  it('returns false if DNS lookup fails', async () => {
    const log = { debug: jest.fn(), info: jest.fn(), error: jest.fn() };
    // Patch dns.lookup to always error
    jest.spyOn(dns, 'lookup').mockImplementation((host, cb) => cb(new Error('fail')));
    const result = await isHostOnline('user@badhost', 22, log);
    expect(result).toBe(false);
  });

  it('returns true if TCP connect receives data', async () => {
    const log = { debug: jest.fn(), info: jest.fn(), error: jest.fn() };
    jest.spyOn(dns, 'lookup').mockImplementation((host, cb) => cb(null, '127.0.0.1'));

    const handlers = {};
    const socket = {
      setTimeout: jest.fn(),
      on: (event, cb) => { handlers[event] = cb; },
      end: jest.fn(),
    };

    jest.spyOn(net, 'createConnection').mockReturnValue(socket);

    setTimeout(() => {
      handlers['data'](Buffer.from('hello'));
    }, 0);

    const result = await isHostOnline('user@host', 22, log);
    expect(result).toBe(true);
  });

  it('returns false if TCP connect times out', async () => {
    const log = { debug: jest.fn(), info: jest.fn(), error: jest.fn() };
    jest.spyOn(dns, 'lookup').mockImplementation((host, cb) => cb(null, '127.0.0.1'));

    const handlers = {};
    const socket = {
      setTimeout: jest.fn(),
      on: (event, cb) => { handlers[event] = cb; },
      destroy: jest.fn(),
    };

    jest.spyOn(net, 'createConnection').mockReturnValue(socket);

    setTimeout(() => {
      handlers['timeout']();
    }, 0);

    const result = await isHostOnline('user@host', 22, log);
    expect(result).toBe(false);
  });

  it('returns false if TCP connect errors', async () => {
    const log = { debug: jest.fn(), info: jest.fn(), error: jest.fn() };
    jest.spyOn(dns, 'lookup').mockImplementation((host, cb) => cb(null, '127.0.0.1'));

    const handlers = {};
    const socket = {
      setTimeout: jest.fn(),
      on: (event, cb) => { handlers[event] = cb; },
      destroy: jest.fn(),
    };

    jest.spyOn(net, 'createConnection').mockReturnValue(socket);

    setTimeout(() => {
      handlers['error'](new Error('fail'));
    }, 0);

    const result = await isHostOnline('user@host', 22, log);
    expect(result).toBe(false);
  });

  it('returns false if TCP socket closes before resolving', async () => {
    const log = { debug: jest.fn(), info: jest.fn(), error: jest.fn() };
    jest.spyOn(dns, 'lookup').mockImplementation((host, cb) => cb(null, '127.0.0.1'));

    const handlers = {};
    const socket = {
      setTimeout: jest.fn(),
      on: (event, cb) => { handlers[event] = cb; },
    };

    jest.spyOn(net, 'createConnection').mockReturnValue(socket);

    setTimeout(() => {
      handlers['close'](false);
    }, 0);

    const result = await isHostOnline('user@host', 22, log);
    expect(result).toBe(false);
  });
});
