#!/usr/bin/env node
import 'dotenv/config';
import net from 'net';
import dns from 'dns';
import {
    log as logger,
    fs as defaultFs,
    path as commonPath,
    registerHandlers,
    registerSignals
} from '@purinton/common';
import { sshExec as defaultSshExec } from '@purinton/ssh-client';

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
    // servers = { "user@host1": [ ... ], ... }
    // Order: cluster*, app*, dev*
    const all = Object.entries(servers).map(([userAtHost, services]) => {
        const [, host] = userAtHost.split('@');
        let group = 'other';
        if (host.startsWith('cluster')) group = 'cluster';
        else if (host.startsWith('app')) group = 'app';
        else if (host.startsWith('dev')) group = 'dev';
        return { userAtHost, host, services, group };
    });
    // Sort: cluster, app, dev, then any others
    all.sort((a, b) => {
        const order = { cluster: 0, app: 1, dev: 2, other: 3 };
        if (order[a.group] !== order[b.group]) return order[a.group] - order[b.group];
        return a.host.localeCompare(b.host);
    });
    return all;
}

export function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
}

export async function runUpdater({ log = logger, serversFile, fsLib = defaultFs, sshExec = defaultSshExec, sleepFn = sleep } = {}) {
    const servers = getOrderedServers(serversFile || commonPath(import.meta, 'servers.json'), fsLib);
    log.info('Starting update process...');
    for (const { userAtHost, host, services, group } of servers) {
        log.info(`Processing ${group} server: ${host}`);
        await stopServices(userAtHost, services, log, sshExec);
        await updateAndReboot(userAtHost, log, sshExec);
        await waitForHostOffline(userAtHost, 22, 600, 5, log, sleepFn);
        await waitForHostOnline(userAtHost, 22, 600, 5, log, sleepFn);
        if (group !== 'dev') {
            await verifyServices(userAtHost, services, 5, log, sshExec, sleepFn);
        }
        log.info(`Completed updates for ${group} server: ${host}`);
    }
}

export async function stopServices(userAtHost, services, log = logger, sshExec = defaultSshExec) {
    if (!services || services.length === 0) {
        log.info(`No services defined for ${userAtHost} to stop.`);
        return;
    }
    const serviceList = services.join(' ');
    log.info(`Stopping services on ${userAtHost}: ${serviceList}...`);
    await sshExec({ host: userAtHost, commands: [`sudo systemctl stop ${serviceList}`] });
    log.info(`Stopped services on ${userAtHost}`);
}

export async function updateAndReboot(userAtHost, log = logger, sshExec = defaultSshExec) {
    log.info(`Updating and rebooting ${userAtHost}...`);
    await sshExec({ host: userAtHost, commands: ['yum -y update && reboot'] });
    log.info(`Update/reboot command completed for ${userAtHost}`);
}

export async function waitForHostOffline(userAtHost, port = 22, timeoutSeconds = 600, checkInterval = 5, log = logger, sleepFn = sleep, isHostOnlineFn = isHostOnline) {
    log.info(`Waiting for ${userAtHost} to go offline...`);
    const start = Date.now();
    while ((Date.now() - start) / 1000 < timeoutSeconds) {
        const online = await isHostOnlineFn(userAtHost, port, log);
        if (!online) {
            log.info(`${userAtHost} is now offline.`);
            return;
        }
        log.info(`${userAtHost} is still online, retrying in ${checkInterval}s...`);
        await sleepFn(checkInterval * 1000);
    }
    throw new Error(`Timeout waiting for ${userAtHost} to go offline.`);
}

export async function waitForHostOnline(userAtHost, port = 22, timeoutSeconds = 600, checkInterval = 5, log = logger, sleepFn = sleep, isHostOnlineFn = isHostOnline) {
    log.info(`Waiting for ${userAtHost} to come back online...`);
    const start = Date.now();
    while ((Date.now() - start) / 1000 < timeoutSeconds) {
        if (await isHostOnlineFn(userAtHost, port, log)) {
            log.info(`${userAtHost} is back online.`);
            return;
        }
        log.info(`${userAtHost} is still offline, retrying in ${checkInterval}s...`);
        await sleepFn(checkInterval * 1000);
    }
    throw new Error(`Timeout waiting for ${userAtHost} to come back online.`);
}

export async function isHostOnline(userAtHost, port = 22, log = logger) {
    // Try DNS resolution first for debugging
    const hostname = userAtHost.replace(/^.*@/, '');
    try {
        const addresses = await new Promise((resolve) => {
            dns.lookup(hostname, (err, address) => {
                if (err) {
                    log.error(`[DEBUG] DNS lookup failed for ${userAtHost}: ${err.message}`);
                    resolve(null);
                } else {
                    log.info(`[DEBUG] DNS lookup for ${userAtHost}: ${address}`);
                    resolve(address);
                }
            });
        });
        if (!addresses) {
            log.error(`[DEBUG] Host ${userAtHost} could not be resolved by DNS.`);
            return false;
        }
    } catch (e) {
        log.error(`[DEBUG] Unexpected DNS error for ${userAtHost}: ${e}`);
        return false;
    }
    // Now try TCP connect
    return new Promise(resolve => {
        let resolved = false;
        const socket = net.createConnection({ port, host: hostname });
        socket.setTimeout(5000);
        socket.on('data', (data) => {
            if (!resolved) {
                resolved = true;
                socket.end();
                log.info(`[DEBUG] TCP connect to ${userAtHost}:${port} received data: ${data.toString()}`);
                resolve(true); // Only resolve true if SSH banner is received
            }
        });
        socket.on('connect', () => {
            // Do nothing here, wait for 'data' event (SSH banner)
        });
        socket.on('timeout', () => {
            if (!resolved) {
                resolved = true;
                socket.destroy();
                log.info(`[DEBUG] TCP connect to ${userAtHost}:${port} timed out.`);
                resolve(false);
            }
        });
        socket.on('error', (err) => {
            if (!resolved) {
                resolved = true;
                socket.destroy();
                log.info(`[DEBUG] TCP connect to ${userAtHost}:${port} error: ${err.message}`);
                resolve(false);
            }
        });
        socket.on('close', (hadError) => {
            if (!resolved) {
                resolved = true;
                log.info(`[DEBUG] TCP socket to ${userAtHost}:${port} closed (hadError=${hadError}).`);
                resolve(false);
            }
        });
    });
}

export async function verifyServices(userAtHost, services, checkInterval = 5, log = logger, sshExec = defaultSshExec, sleepFn = sleep) {
    if (!services || services.length === 0) return;
    log.info(`Verifying services on ${userAtHost}: ${services.join(', ')}`);
    const serviceList = services.join(' ');
    let attempt = 1;
    while (true) {
        let output;
        try {
            output = await sshExec({ host: userAtHost, commands: [`systemctl is-active ${serviceList}`] });
        } catch (e) {
            log.error(`Attempt ${attempt}: Failed to check service status on ${userAtHost}: ${e}`);
            await sleepFn(checkInterval * 1000);
            attempt++;
            continue;
        }
        const statuses = (output[0]?.result || '').trim().split(/\r?\n/);
        const statusResults = services.map((service, i) => ({ service, status: statuses[i] || 'unknown' }));
        const notActive = statusResults.filter(r => r.status !== 'active');
        const activating = statusResults.filter(r => r.status === 'activating');
        if (notActive.length === 0) {
            log.info(`All services are active on ${userAtHost}.`);
            break;
        } else if (activating.length > 0) {
            log.info(`Attempt ${attempt}: Some services are still activating on ${userAtHost}: ${activating.map(r => r.service).join(', ')}`);
            await sleepFn(checkInterval * 1000);
        } else {
            const failed = notActive.filter(r => r.status !== 'activating');
            log.error(`Attempt ${attempt}: Some services failed to start on ${userAtHost}: ${failed.map(r => r.service + ' (' + r.status + ')').join(', ')}`);
            throw new Error(`Service(s) not active: ${failed.map(r => r.service).join(', ')}`);
        }
        attempt++;
    }
    // All services are active, wait 5 seconds before continuing
    await sleepFn(5000);
}

// CLI entrypoint
if (process.env.NODE_ENV !== 'test') {
    registerHandlers({ log: logger });
    registerSignals({ log: logger });
    const serversFile = commonPath(import.meta, 'servers.json');
    runUpdater({ serversFile });
}

