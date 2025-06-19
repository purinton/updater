import { log as logger } from '@purinton/common';
import { sleep } from './sleep.mjs';
import { isHostOnline } from './isHostOnline.mjs';

/**
 * Wait until a host comes back online.
 */
export async function waitForHostOnline(
    userAtHost,
    port = 22,
    timeoutSeconds = 600,
    checkInterval = 5,
    log = logger,
    sleepFn = sleep,
    isHostOnlineFn = isHostOnline
) {
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
