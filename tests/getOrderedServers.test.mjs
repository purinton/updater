import { jest } from '@jest/globals';
import { getOrderedServers } from '../src/getOrderedServers.mjs';

describe('getOrderedServers', () => {
  it('orders servers by prefix and host', () => {
    const servers = {
      'user@cluster2': ['svc1'],
      'user@dev1': ['svc2'],
      'user@app1': ['svc3'],
      'user@cluster1': ['svc4'],
      'user@other': ['svc5']
    };
    const fsLib = {
      existsSync: jest.fn(() => true),
      readFileSync: jest.fn(() => JSON.stringify(servers))
    };
    const result = getOrderedServers('mock', fsLib);
    expect(result.map(s => s.host)).toEqual([
      'cluster1', 'cluster2', 'app1', 'dev1', 'other'
    ]);
  });
});
