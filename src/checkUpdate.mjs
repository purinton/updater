import { sshExec } from '@purinton/ssh-client';
import { sendMessage } from '@purinton/discord-webhook';
import { log as logger } from '@purinton/common';
import { notifyUpdate } from './notifyUpdate.mjs';
import { notifyError } from './notifyError.mjs';

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
            await notifyUpdate({ host, result, sendMsg });
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
        await notifyError({ username, host, err, sendMsg });
    }
}
