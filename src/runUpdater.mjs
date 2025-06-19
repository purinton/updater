import { log as defaultLog } from '@purinton/common';
import { getOrderedServers as defaultGetOrderedServers } from './getOrderedServers.mjs';
import { stopServices as defaultStopServices } from './stopServices.mjs';
import { updateAndReboot as defaultUpdateAndReboot } from './updateAndReboot.mjs';
import { waitForHostOffline as defaultWaitForHostOffline } from './waitForHostOffline.mjs';
import { waitForHostOnline as defaultWaitForHostOnline } from './waitForHostOnline.mjs';
import { verifyServices as defaultVerifyServices } from './verifyServices.mjs';
import { sleep } from './sleep.mjs';

/**
 * Main updater orchestration: stops services, updates & reboots, then verifies.
 */
export default async function runUpdater({
    log = defaultLog,
    serversFile,
    fsLib,
    sshExec,
    sleepFn = sleep,
    getOrderedServers = defaultGetOrderedServers,
    stopServices = defaultStopServices,
    updateAndReboot = defaultUpdateAndReboot,
    waitForHostOffline = defaultWaitForHostOffline,
    waitForHostOnline = defaultWaitForHostOnline,
    verifyServices = defaultVerifyServices
} = {}) {
    const servers = getOrderedServers(serversFile, fsLib);
    log.info('Starting update process...');
    for (const { userAtHost, host, services, group } of servers) {
        log.info(`Processing ${group} server: ${host}`);
        await stopServices(userAtHost, services, log, sshExec);
        await updateAndReboot(userAtHost, log, sshExec);
        await waitForHostOffline(userAtHost, 22, 600, 5, log, sleepFn);
        await waitForHostOnline(userAtHost, 22, 600, 5, log, sleepFn);
        if (group !== 'dev') {
            await verifyServices(userAtHost, services, undefined, log, sshExec, sleepFn);
        }
        log.info(`Completed updates for ${group} server: ${host}`);
    }
}
