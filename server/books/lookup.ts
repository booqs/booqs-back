import { groupBy, flatten } from 'lodash';
import { parseId, filterUndefined, makeId } from '../../core';
import { LibraryCard } from '../sources';
import { sources, processCard } from './libSources';
import { pgCards } from '../gutenberg/schema';

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
        const source = sources[sourcePrefix];
        if (source) {
            const forSource = await source.cards(pids.map(p => p.id));
            return forSource.map(processCard(sourcePrefix));
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

export async function featuredIds(limit: number) {
    return pgCards
        .find()
        .limit(limit)
        .select('index')
        .exec()
        .then(rs => rs.map(r => makeId('pg', r.index)));
}
