import { flatten } from 'lodash'
import { LibraryCard, SearchScope } from '../sources'
import { sources, processCard } from './libSources'

export async function search(query: string, limit: number, scope: SearchScope[]): Promise<LibraryCard[]> {
    if (!query) {
        return []
    }
    const cards = Object.entries(sources).map(
        async ([prefix, source]) => {
            if (source) {
                const results = await source.search(query, limit, scope)
                return results.map(processCard(prefix))
            } else {
                return []
            }
        },
    )

    const all = await Promise.all(cards)
    return flatten(all)
}
