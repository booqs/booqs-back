import { SearchResult, SearchScope } from '../sources'
import { sources, processCard } from './libSources'

export async function search(query: string, limit: number, scope: SearchScope[]): Promise<SearchResult[]> {
    if (!query) {
        return []
    }
    const cards = Object.entries(sources).map(
        async ([prefix, source]) => {
            if (source) {
                const results = await source.search(query, limit, scope)
                return results.map(processSearchResult(prefix))
            } else {
                return []
            }
        },
    )

    const all = await Promise.all(cards)
    return all.flat()
}

function processSearchResult(prefix: string) {
    let cardProcessor = processCard(prefix)
    return function (result: SearchResult): SearchResult {
        if (result.kind === 'book') {
            return {
                ...result,
                card: cardProcessor(result.card),
            }
        } else {
            return result
        }
    }
}
