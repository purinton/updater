#!/usr/bin/env node
import 'dotenv/config';
import {
    log as logger,
    registerHandlers,
    registerSignals,
    path as commonPath
} from '@purinton/common';
import cron from 'node-cron';
import { runCheckForAllServers } from './src/runCheckForAllServers.mjs';

export async function main(options = {}) {
    await runCheckForAllServers(options);
}

// CLI entrypoint
if (process.env.NODE_ENV !== 'test') {
    registerHandlers({ log: logger });
    registerSignals({ log: logger });
    const serversFile = commonPath(import.meta, 'servers.json');
    main({ serversFile }).catch(err => {
        logger.error('Fatal error in main', err);
        process.exit(1);
    });
    // Schedule to run at the top of each hour
    cron.schedule('0 * * * *', () => {
        main().catch(err => {
            logger.error('Fatal error in scheduled main', err);
        });
    });
    // Keep process alive
    setInterval(() => { }, 1 << 30);
}

