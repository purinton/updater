/**
 * Perform yum update and reboot via SSH.
 * @param {string} userAtHost
 * @param {object} log
 * @param {Function} sshExec
 */
export async function updateAndReboot(userAtHost, log, sshExec) {
    const [username, host] = userAtHost.split('@');
    log.info(`Updating and rebooting ${userAtHost}...`);
    await sshExec({ host, username, commands: ['yum clean all && yum -y update && reboot'] });
    log.info(`Update/reboot command completed for ${userAtHost}`);
}
