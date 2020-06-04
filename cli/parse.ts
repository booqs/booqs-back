import { promisify } from 'util';
import { exists, lstat, readdir, readFile } from 'fs';
import { join } from 'path';
import { parseEpub } from '../parser';
import { pretty } from '../server/utils';

export async function parseEpubs(path: string) {
    if (!await promisify(exists)(path)) {
        console.log(`No such file or directory: ${path}`);
        return;
    }

    for await (const filePath of listEpubs([path])) {
        await processFile(filePath);
    }
}

async function processFile(filePath: string) {
    console.log(pretty(`Processing ${filePath}`));
    const file = await promisify(readFile)(filePath);
    const result = await parseEpub({ fileData: file });
    console.log(pretty(result?.meta));
}

async function* listEpubs(paths: string[]): AsyncGenerator<string> {
    for (const path of paths) {
        const info = await promisify(lstat)(path);
        if (info.isDirectory()) {
            const dir = await promisify(readdir)(path);
            const subs = dir.map(s => join(path, s));
            yield* listEpubs(subs);
        } else if (info.isFile()) {
            if (path.endsWith('.epub')) {
                yield path;
            }
        }
    }
}