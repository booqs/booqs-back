import { pgCards } from './schema'
import { SearchResult, SearchScope } from '../sources'

export async function search(query: string, limit: number, scope: SearchScope[]): Promise<ScoredSearch[]> {
    let promises: Promise<ScoredSearch[]>[] = []
    for (const s of scope) {
        switch (s) {
            case 'title':
                promises.push(searchBooks({ path: 'title', query, limit }))
                break
            case 'author':
                promises.push(searchBooks({ path: 'author', query, limit }))
                break
            case 'subject':
                promises.push(searchAuthors({ query, limit }))
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

type ScoredSearch = SearchResult & {
    score: number,
}
async function searchBooks({
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
}): Promise<ScoredSearch[]> {
    let docs = await (await pgCards).aggregate([
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
    return docs.map(({ score, ...rest }) => ({
        kind: 'book',
        score,
        card: rest,
    }))
}

async function searchAuthors({
    query,
    fuzzy = false,
    boost = 1,
    limit = 10,
}: {
    query: string,
    fuzzy?: boolean,
    boost?: number,
    limit?: number,
}): Promise<ScoredSearch[]> {
    let docs = await (await pgCards).aggregate([
        {
            $search: {
                compound: {
                    must: [
                        {
                            text: {
                                query,
                                path: 'author',
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
            $project: {
                score: { '$meta': 'searchScore' },
                name: '$author',
            },
        },
    ]).exec()
    return docs.map(d => ({
        kind: 'author',
        score: d.score,
        author: {
            name: d.name,
        },
    }))
}
