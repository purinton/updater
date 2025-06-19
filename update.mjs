#!/usr/bin/env node
import 'dotenv/config';
import { log, path, registerHandlers, registerSignals } from '@purinton/common';
import { sshExec } from '@purinton/ssh-client';
import runUpdater from './src/runUpdater.mjs';

// CLI entrypoint
if (process.env.NODE_ENV !== 'test') {
    registerHandlers({ log });
    registerSignals({ log });
    const serversFile = path(import.meta, 'servers.json');
    runUpdater({ serversFile, sshExec }).catch(err => {
        log.error('Fatal error in updater', err);
        process.exit(1);
    });
}

