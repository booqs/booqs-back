import { groupBy, flatten } from 'lodash';
import { makeId, parseId, filterUndefined } from '../../core';
import { LibraryCard, LibrarySource } from '../sources';
import { userUploadsLib } from '../uploads';
import { sources, userUploads } from './libSources';
import { ReadStream } from 'fs';
import { pgCards } from '../gutenberg/schema';

export * from './content';

export async function search(query: string, limit: number): Promise<LibraryCard[]> {
    if (!query) {
        return [];
    }
    const cards = sources.map(
        source => source.search(query, limit)
            .then(
                results => results.map(processCard(source)),
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
            return forSource.map(processCard(source));
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
    return card && processCard(userUploads)(card);
}

export async function featuredIds(limit: number) {
    return pgCards
        .find()
        .limit(limit)
        .select('index')
        .exec()
        .then(rs => rs.map(r => makeId('pg', r.index)));
}

function processCard({ prefix, imagesRoot }: LibrarySource) {
    return (card: LibraryCard) => ({
        ...card,
        id: makeId(prefix, card.id),
        cover: `${imagesRoot}/${card.cover}`,
    });
}
