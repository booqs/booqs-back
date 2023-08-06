#! /usr/bin/env node
import { prepPgLib } from './pgprep'
import { parseEpubs } from './parse'

exec()

async function exec() {
    const [_, __, cmd, ...args] = process.argv
    switch (cmd) {
        case 'pgprep': {
            const [from, to] = args
            if (from && to) {
                await prepPgLib(from, to)
            }
            break
        }
        case 'parse': {
            const [path, verbose] = args
            if (path) {
                await parseEpubs(path, {
                    verbose: verbose === '--verbose',
                })
            }
            break
        }
        default: {
            console.log(`Unknown command: ${cmd}`)
            break
        }
    }
}
