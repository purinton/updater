import { fs, log as logger } from '@purinton/common';

export function parseServersFile(serversFile, fsLib = fs, log = logger) {
    if (!fsLib.existsSync(serversFile)) {
        log.error(`Servers file not found: ${serversFile}`);
        process.exit(1);
    }
    const content = fsLib.readFileSync(serversFile, 'utf8');
    let servers;
    try {
        servers = JSON.parse(content);
    } catch {
        log.error(`Invalid JSON in servers file: ${serversFile}`);
        process.exit(1);
    }
    return servers;
}
