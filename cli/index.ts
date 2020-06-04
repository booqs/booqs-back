#! /usr/bin/env node
import { prepPgLib } from './pgprep';

exec();

async function exec() {
    const [_, __, cmd, ...args] = process.argv;
    switch (cmd) {
        case 'pgprep': {
            const [from, to] = args;
            if (from && to) {
                await prepPgLib(from, to);
            }
            break;
        }
    }
}
