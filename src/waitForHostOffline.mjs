import { log as logger } from '@purinton/common';
import { sleep } from './sleep.mjs';
import { isHostOnline } from './isHostOnline.mjs';

/**
 * Wait until a host goes offline.
 */
export async function waitForHostOffline(
    userAtHost,
    port = 22,
    timeoutSeconds = 600,
    checkInterval = 5,
    log = logger,
    sleepFn = sleep,
    isHostOnlineFn = isHostOnline
) {
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
