#!/usr/bin/env node
import 'dotenv/config';
import { registerHandlers, registerSignals, log as logger, path as commonPath } from '@purinton/common';
import { sshExec } from '@purinton/ssh-client';
import runUpdater from './src/runUpdater.mjs';

// CLI entrypoint
if (process.env.NODE_ENV !== 'test') {
    registerHandlers({ log: logger });
    registerSignals({ log: logger });
    const serversFile = commonPath(import.meta, 'servers.json');
    runUpdater({ serversFile, sshExec }).catch(err => {
        logger.error('Fatal error in updater', err);
        process.exit(1);
    });
}

