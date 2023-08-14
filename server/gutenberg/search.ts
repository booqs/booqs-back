import { pgCards } from './schema'
import { LibraryCard, SearchScope } from '../sources'

export async function search(query: string, limit: number, scope: SearchScope[]): Promise<SearchResult[]> {
    let promises: Promise<SearchResult[]>[] = []
    for (const s of scope) {
        switch (s) {
            case 'title':
                promises.push(searchQuery({ path: 'title', query, limit }))
                break
            case 'author':
                promises.push(searchQuery({ path: 'author', query, limit }))
                break
            case 'subject':
                promises.push(searchQuery({ path: 'subject', query, limit }))
                break
            default:
                console.warn(`Unknown search scope ${s}`)
                break
        }
    }
    let allResults = (await Promise.all(promises)).flat()
    let sorted = allResults.sort((a, b) => b.score - a.score).slice(0, limit)
    return sorted
}

type SearchResult = LibraryCard & {
    score: number,
}
async function searchQuery({
    path,
    query,
    fuzzy = false,
    boost = 1,
    limit = 10,
}: {
    path: string,
    query: string,
    fuzzy?: boolean,
    boost?: number,
    limit?: number,
}): Promise<SearchResult[]> {
    return (await pgCards).aggregate([
        {
            $search: {
                compound: {
                    must: [
                        {
                            text: {
                                query,
                                path,
                                fuzzy: fuzzy ? {} : undefined,
                                score: { boost: { value: boost } },
                            },
                        },
                    ],
                },
            },
        },
        {
            $limit: limit,
        },
        {
            $addFields: {
                id: '$index',
                score: { '$meta': 'searchScore' },
            },
        },
    ]).exec()
}
