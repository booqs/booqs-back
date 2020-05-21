import { parseId, Booq } from '../../core';
import { parseEpub } from '../../parser';
import { sources } from './libSources';

const cache: {
    [booqId: string]: Booq | undefined,
} = {};

export async function booqForId(booqId: string) {
    const cached = cache[booqId];
    if (cached) {
        return cached;
    }

    const file = await fileForId(booqId);
    if (!file) {
        return undefined;
    }
    // TODO: log diagnostics
    const booq = await parseEpub({
        fileData: file.file,
        diagnoser: d => console.log(d),
    });
    cache[booqId] = booq;
    return booq;
}

async function fileForId(booqId: string) {
    const [prefix, id] = parseId(booqId);
    const source = sources.find(s => s.prefix === prefix);
    return source && id
        ? source.fileForId(id)
        : undefined;
}
