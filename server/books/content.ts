import { parseId, Booq, logTime } from '../../core';
import { parseEpub } from '../../parser';
import { sources } from './libSources';

const cache: {
    [booqId: string]: Promise<Booq | undefined>,
} = {};

export async function booqForId(booqId: string) {
    const cached = cache[booqId];
    if (cached) {
        return cached;
    } else {
        const promise = parseBooqForId(booqId);
        cache[booqId] = promise;
        return promise;
    }
}

async function parseBooqForId(booqId: string) {
    const file = await fileForId(booqId);
    if (!file) {
        return undefined;
    }
    const booq = await logTime(() => parseEpub({
        fileData: file.file,
        diagnoser: d => console.log(d),
    }), 'Parser');
    return booq;
}

async function fileForId(booqId: string) {
    const [prefix, id] = parseId(booqId);
    const source = sources[prefix];
    return source && id
        ? source.fileForId(id)
        : undefined;
}
