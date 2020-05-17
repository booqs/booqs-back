import { flatten } from 'lodash';
import { LibraryCard } from '../sources';
import { sources, processCard } from './libSources';

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
