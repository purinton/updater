import { fs as defaultFs } from '@purinton/common';

/**
 * Read and order servers by group: cluster*, app*, dev*, other
 * @param {string} serversFile
 * @param {object} fsLib
 */
export function getOrderedServers(serversFile, fsLib = defaultFs) {
    if (!fsLib.existsSync(serversFile)) {
        throw new Error(`Servers file not found: ${serversFile}`);
    }
    const content = fsLib.readFileSync(serversFile, 'utf8');
    let servers;
    try {
        servers = JSON.parse(content);
    } catch {
        throw new Error(`Invalid JSON in servers file: ${serversFile}`);
    }
    const all = Object.entries(servers).map(([userAtHost, services]) => {
        const [, host] = userAtHost.split('@');
        let group = 'other';
        if (host.startsWith('cluster')) group = 'cluster';
        else if (host.startsWith('app')) group = 'app';
        else if (host.startsWith('dev')) group = 'dev';
        return { userAtHost, host, services, group };
    });
    all.sort((a, b) => {
        const order = { cluster: 0, app: 1, dev: 2, other: 3 };
        if (order[a.group] !== order[b.group]) return order[a.group] - order[b.group];
        return a.host.localeCompare(b.host);
    });
    return all;
}
