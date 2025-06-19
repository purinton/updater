import { log as logger } from '@purinton/common';

/**
 * Verify that services are active on the remote host.
 */
export async function verifyServices(userAtHost, services, checkInterval = 5, log = logger, sshExec, sleepFn) {
    if (!services || services.length === 0) return;
    const [username, host] = userAtHost.split('@');
    log.info(`Verifying services on ${userAtHost}: ${services.join(', ')}`);
    const serviceList = services.join(' ');
    let attempt = 1;
    while (true) {
        let output;
        try {
            output = await sshExec({ host, username, commands: [`systemctl is-active ${serviceList}`] });
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
    await sleepFn(5000);
}
