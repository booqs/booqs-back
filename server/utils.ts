import { promisify } from 'util';
import { writeFile, exists, mkdir } from 'fs';
import { join } from 'path';
import { uuid } from '../core';

export async function* makeBatches<T>(generator: AsyncGenerator<T>, size: number) {
    let batch: T[] = [];
    for await (const item of generator) {
        if (batch.length < size) {
            batch.push(item);
        } else {
            yield batch;
            batch = [item];
        }
    }
    if (batch.length > 0) {
        yield batch;
    }
}

export async function writeTempFile(body: any) {
    const filePath = await tempPath();
    await promisify(writeFile)(filePath, body);
    return filePath;
}

export async function tempPath() {
    const temp = 'tmp';
    if (!await promisify(exists)(temp)) {
        await promisify(mkdir)(temp, { recursive: true });
    }
    return join(temp, uuid());
}

export function afterPrefix(str: string, prefix: string): string | undefined {
    if (str.startsWith(prefix)) {
        return str.substr(prefix.length);
    } else {
        return undefined;
    }
}
