import { groupBy, flatten } from 'lodash';
import { makeId, parseId, filterUndefined } from '../../core';
import { LibraryCard } from '../sources';
import { userUploadsLib } from '../uploads';
import { sources } from './libSources';
import { ReadStream } from 'fs';

export * from './content';

export async function search(query: string, limit: number): Promise<LibraryCard[]> {
    const cards = sources.map(
        source => source.search(query, limit)
            .then(
                results => results.map(addIdPrefix(source.prefix)),
            ),
    );

    return Promise.all(cards).then(flatten);
}

export async function forIds(ids: string[]): Promise<Array<LibraryCard | undefined>> {
    const parsed = filterUndefined(
        ids.map(idString => {
            const [source, id] = parseId(idString);
            return source && id
                ? { source, id }
                : undefined;
        }),
    );
    const grouped = groupBy(
        parsed,
        id => id.source,
    );
    const groupedResults = Object.entries(grouped).map(async ([sourcePrefix, pids]) => {
        const source = sources.find(s => s.prefix === sourcePrefix);
        if (source) {
            const forSource = await source.cards(pids.map(p => p.id));
            return forSource.map(addIdPrefix(sourcePrefix));
        } else {
            return undefined;
        }
    });
    const results = flatten(
        filterUndefined(await Promise.all(groupedResults)),
    );
    return ids.map(
        id => results.find(r => r.id === id),
    );
}

export async function uploadEpub(fileStream: ReadStream, userId: string) {
    const card = await userUploadsLib.uploadEpub(fileStream, userId);
    return card && addIdPrefix('uu')(card);
}

function addIdPrefix(prefix: string) {
    return (card: LibraryCard) => ({
        ...card,
        id: makeId(prefix, card.id),
        cover: card.cover && makeId(prefix, card.cover),
    });
}