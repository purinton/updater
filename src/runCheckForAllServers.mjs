import { parseServersFile as defaultParseServersFile } from './parseServersFile.mjs';
import { checkUpdate as defaultCheckUpdate } from './checkUpdate.mjs';
import { log as logger, fs, path as commonPath } from '@purinton/common';
import { sshExec } from '@purinton/ssh-client';
import { sendMessage } from '@purinton/discord-webhook';

export async function runCheckForAllServers({
    serversFile = commonPath(import.meta, '..', 'servers.json'),
    sshExecFn = sshExec,
    sendMsg = sendMessage,
    log = logger,
    fsLib = fs,
    parseServersFile = defaultParseServersFile,
    checkUpdate = defaultCheckUpdate
} = {}) {
    const servers = parseServersFile(serversFile, fsLib, log);
    const hosts = Object.keys(servers || {});
    if (hosts.length === 0) {
        log.error('No servers defined in servers.json');
        process.exit(1);
    }
    await Promise.all(
        hosts.map(entry => {
            const [username, host] = entry.split('@');
            return checkUpdate({ host, username, sshExecFn, sendMsg, log });
        })
    );
}
