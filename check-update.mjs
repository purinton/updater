#!/usr/bin/env node
import 'dotenv/config';
import cron from 'node-cron';
import { log, path, registerHandlers, registerSignals } from '@purinton/common';
import { runCheckForAllServers } from './src/runCheckForAllServers.mjs';

// CLI entrypoint
if (process.env.NODE_ENV !== 'test') {
    registerHandlers({ log });
    registerSignals({ log });
    const serversFile = path(import.meta, 'servers.json');
    await runCheckForAllServers({ serversFile }).catch(err => {
        log.error('Fatal error in main', err);
        process.exit(1);
    });
    cron.schedule('0 * * * *', () => {
        log.info('Running scheduled check for updates');
        runCheckForAllServers({ serversFile }).catch(err => {
            log.error('Fatal error in scheduled main', err);
        });
    });
    log.info('Scheduled check for updates every hour');
    setInterval(() => { }, 1 << 30);
}

