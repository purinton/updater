#!/usr/bin/env node
import 'dotenv/config';
import {
    log as defaultLog,
    fs,
    path as commonPath,
    registerHandlers,
    registerSignals
} from '@purinton/common';
import { sshExec } from '@purinton/ssh-client';
import { sendMessage } from '@purinton/discord-webhook';

/**
 * Check for yum updates on a host via SSH.
 * @param {Object} options
 * @param {string} options.host
 * @param {string} options.username
 * @param {Function} [options.sshExecFn]
 * @param {Function} [options.sendMsg]
 * @param {Object} [options.logger]
 */
export async function checkUpdate({
    host,
    username,
    sshExecFn = sshExec,
    sendMsg = sendMessage,
    logger = defaultLog
} = {}) {
    logger.debug('Checking updates', { host, username });
    try {
        const [{ result, code }] = await sshExecFn({ host, username, commands: ['yum -y check-update'] });
        logger.debug('Update check result', { host, username, code });
        if (code !== 0) {
            logger.info('Updates found', { host, username, code });
            await sendMsg({ body: { content: `Updates found on ${username}@${host}:\n${result.slice(0, 1900)}` } });
        } else {
            logger.info('No updates found', { host, username });
        }
    } catch (err) {
        logger.error('Error checking updates', {
            host,
            username,
            errorMessage: err?.message,
            errorStack: err?.stack,
            error: err
        });
        await sendMsg({ body: { content: `Error checking updates on ${username}@${host}:\n${err?.message}` } });
    }
}

/**
 * Read servers.json and run checkUpdate for each host.
 * @param {Object} options
 * @param {string} [options.serversFile]
 * @param {Function} [options.sshExecFn]
 * @param {Function} [options.sendMsg]
 * @param {Object} [options.logger]
 */
export async function main({
    serversFile = commonPath(import.meta, 'servers.json'),
    sshExecFn = sshExec,
    sendMsg = sendMessage,
    logger = defaultLog,
    fsLib = fs
} = {}) {
    registerHandlers({ log: defaultLog });
    registerSignals({ log: defaultLog });
    if (!fsLib.existsSync(serversFile)) {
        logger.error(`Servers file not found: ${serversFile}`);
        process.exit(1);
    }
    const content = fsLib.readFileSync(serversFile, 'utf8');
    let servers;
    try {
        servers = JSON.parse(content);
    } catch {
        logger.error(`Invalid JSON in servers file: ${serversFile}`);
        process.exit(1);
    }
    const hosts = Object.keys(servers || {});
    if (hosts.length === 0) {
        logger.error('No servers defined in servers.json');
        process.exit(1);
    }
    await Promise.all(
        hosts.map(entry => {
            const [username] = entry.split('@');
            return checkUpdate({ host: entry, username, sshExecFn, sendMsg, logger });
        })
    );
}

// CLI entrypoint
if (process.env.NODE_ENV !== 'test') {
    main().catch(err => {
        defaultLog.error('Fatal error in main', err);
        process.exit(1);
    });
}

