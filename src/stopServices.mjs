import { log as logger } from '@purinton/common';

/**
 * Stop services via SSH on a remote host.
 * @param {string} userAtHost
 * @param {string[]} services
 * @param {*} log
 * @param {Function} sshExec
 */
export async function stopServices(userAtHost, services, log = logger, sshExec) {
    if (!services || services.length === 0) {
        log.info(`No services defined for ${userAtHost} to stop.`);
        return;
    }
    const [username, host] = userAtHost.split('@');
    const serviceList = services.join(' ');
    log.info(`Stopping services on ${userAtHost}: ${serviceList}...`);
    await sshExec({ host, username, commands: [`sudo systemctl stop ${serviceList}`] });
    log.info(`Stopped services on ${userAtHost}`);
}
