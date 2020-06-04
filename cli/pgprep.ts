import { promisify } from 'util';
import { exists, lstat, readdir, copyFile } from 'fs';
import { join, basename } from 'path';

export async function prepPgLib(from: string, to: string) {
    if (!await existAsync(from)) {
        console.log(`From path doesn't exist: ${from}`);
        return;
    }
    if (!await existAsync(to)) {
        console.log(`To path doesn't exist: ${to}`);
        return;
    }
    for await (const source of listEpubs([from])) {
        const dest = join(to, basename(source));
        copyFileAsync(source, dest);
    }
}

async function copyFileAsync(from: string, to: string) {
    return promisify(copyFile)(from, to);
}

async function existAsync(path: string) {
    return promisify(exists)(path);
}

async function* listEpubs(paths: string[]): AsyncGenerator<string> {
    for (const path of paths) {
        const info = await promisify(lstat)(path);
        if (info.isDirectory()) {
            const dir = await promisify(readdir)(path);
            const subs = dir.map(s => join(path, s));
            yield* listEpubs(subs);
        } else if (info.isFile()) {
            if (path.endsWith('-images.epub')) {
                yield path;
            } else if (path.endsWith('.epub')) {
                if (!paths.some(p => p.endsWith('-images.epub'))) {
                    yield path;
                }
            }
        }
    }
}
