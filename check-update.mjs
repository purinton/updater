#!/usr/bin/env node
import 'dotenv/config';
import {
    log as logger,
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
 * @param {Object} [options.log]
 */
export async function checkUpdate({
    host,
    username,
    sshExecFn = sshExec,
    sendMsg = sendMessage,
    log = logger
} = {}) {
    log.debug('Checking updates', { host });
    try {
        const [{ result, code }] = await sshExecFn({ host, username, commands: ['yum -y check-update'] });
        log.debug('Update check result', { host, code });
        if (code !== 0) {
            log.info('Updates found', { host, code });
            await sendMsg({ body: { content: `Updates found on ${username}@${host}:\n${result.slice(0, 1900)}` } });
        } else {
            log.info('No updates found', { host });
        }
    } catch (err) {
        log.error('Error checking updates', {
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
 * @param {Object} [options.log]
 */
export async function main({
    serversFile = commonPath(import.meta, 'servers.json'),
    sshExecFn = sshExec,
    sendMsg = sendMessage,
    log = logger,
    fsLib = fs
} = {}) {
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

// CLI entrypoint
if (process.env.NODE_ENV !== 'test') {
    registerHandlers({ log: logger });
    registerSignals({ log: logger });
    main().catch(err => {
        logger.error('Fatal error in main', err);
        process.exit(1);
    });
}

