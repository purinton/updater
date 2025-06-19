import net from 'net';
import dns from 'dns';
import { log as logger } from '@purinton/common';

/**
 * Check if a host is online by DNS lookup and TCP connect.
 */
export async function isHostOnline(userAtHost, port = 22, log = logger) {
    const hostname = userAtHost.replace(/^.*@/, '');
    try {
        const addresses = await new Promise(resolve => {
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
    return new Promise(resolve => {
        let resolved = false;
        const socket = net.createConnection({ port, host: hostname });
        socket.setTimeout(5000);
        socket.on('data', data => {
            if (!resolved) {
                resolved = true;
                socket.end();
                log.info(`[DEBUG] TCP connect to ${userAtHost}:${port} received data: ${data.toString()}`);
                resolve(true);
            }
        });
        socket.on('timeout', () => {
            if (!resolved) {
                resolved = true;
                socket.destroy();
                log.info(`[DEBUG] TCP connect to ${userAtHost}:${port} timed out.`);
                resolve(false);
            }
        });
        socket.on('error', err => {
            if (!resolved) {
                resolved = true;
                socket.destroy();
                log.info(`[DEBUG] TCP connect to ${userAtHost}:${port} error: ${err.message}`);
                resolve(false);
            }
        });
        socket.on('close', hadError => {
            if (!resolved) {
                resolved = true;
                log.info(`[DEBUG] TCP socket to ${userAtHost}:${port} closed (hadError=${hadError}).`);
                resolve(false);
            }
        });
    });
}
