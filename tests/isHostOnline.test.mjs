import { isHostOnline } from '../src/isHostOnline.mjs';
import { jest } from '@jest/globals';
import dns from 'dns';
import net from 'net';

describe('isHostOnline', () => {
  it('returns false if DNS lookup fails', async () => {
    const log = { info: jest.fn(), error: jest.fn() };
    // Patch dns.lookup to always error
    jest.spyOn(dns, 'lookup').mockImplementation((host, cb) => cb(new Error('fail')));
    const result = await isHostOnline('user@badhost', 22, log);
    expect(result).toBe(false);
  });

  it('returns true if TCP connect receives data', async () => {
    const log = { info: jest.fn(), error: jest.fn() };
    jest.spyOn(dns, 'lookup').mockImplementation((host, cb) => cb(null, '127.0.0.1'));
    const on = jest.fn();
    const end = jest.fn();
    const socket = { setTimeout: jest.fn(), on, end };
    jest.spyOn(net, 'createConnection').mockReturnValue(socket);
    // Simulate 'data' event
    setTimeout(() => {
      const dataHandler = on.mock.calls.find(([event]) => event === 'data')[1];
      dataHandler(Buffer.from('hello'));
    }, 0);
    const result = await isHostOnline('user@host', 22, log);
    expect(result).toBe(true);
  });

  it('returns false if TCP connect times out', async () => {
    const log = { info: jest.fn(), error: jest.fn() };
    jest.spyOn(dns, 'lookup').mockImplementation((host, cb) => cb(null, '127.0.0.1'));
    const on = jest.fn();
    const destroy = jest.fn();
    const socket = { setTimeout: jest.fn(), on, destroy };
    jest.spyOn(net, 'createConnection').mockReturnValue(socket);
    setTimeout(() => {
      const timeoutHandler = on.mock.calls.find(([event]) => event === 'timeout')[1];
      timeoutHandler();
    }, 0);
    const result = await isHostOnline('user@host', 22, log);
    expect(result).toBe(false);
  });

  it('returns false if TCP connect errors', async () => {
    const log = { info: jest.fn(), error: jest.fn() };
    jest.spyOn(dns, 'lookup').mockImplementation((host, cb) => cb(null, '127.0.0.1'));
    const on = jest.fn();
    const destroy = jest.fn();
    const socket = { setTimeout: jest.fn(), on, destroy };
    jest.spyOn(net, 'createConnection').mockReturnValue(socket);
    setTimeout(() => {
      const errorHandler = on.mock.calls.find(([event]) => event === 'error')[1];
      errorHandler(new Error('fail'));
    }, 0);
    const result = await isHostOnline('user@host', 22, log);
    expect(result).toBe(false);
  });

  it('returns false if TCP socket closes before resolving', async () => {
    const log = { info: jest.fn(), error: jest.fn() };
    jest.spyOn(dns, 'lookup').mockImplementation((host, cb) => cb(null, '127.0.0.1'));
    const on = jest.fn();
    const socket = { setTimeout: jest.fn(), on };
    jest.spyOn(net, 'createConnection').mockReturnValue(socket);
    setTimeout(() => {
      const closeHandler = on.mock.calls.find(([event]) => event === 'close')[1];
      closeHandler(false);
    }, 0);
    const result = await isHostOnline('user@host', 22, log);
    expect(result).toBe(false);
  });
});
