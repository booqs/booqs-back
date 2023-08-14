import { pgCards } from './schema'
import { SearchResult, SearchScope } from '../sources'
import { uniqBy } from 'lodash'

export async function search(query: string, limit: number, scope: SearchScope[]): Promise<ScoredSearch[]> {
    let promises: Promise<ScoredSearch[]>[] = []
    for (const s of scope) {
        switch (s) {
            case 'title':
                promises.push(searchBooks({ path: 'title', query, limit }))
                break
            case 'author':
                promises.push(searchAuthors({ query, limit, boost: 1.5 }))
                break
            case 'subject':
                promises.push(searchBooks({ path: 'subjects', query, limit }))
                break
            default:
                console.warn(`Unknown search scope ${s}`)
                break
        }
    }
    let allResults = (await Promise.all(promises)).flat()
    let sorted = allResults.sort((a, b) => b.score - a.score).slice(0, limit)
    console.log('sorter', sorted)
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
    let cursor = (await pgCards).aggregate([
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
    ])
    let docs = await cursor.exec()
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
    let cursor = (await pgCards).aggregate([
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
    ])
    let docs = await cursor.exec()
    let mapped = docs.map(d => ({
        kind: 'author' as const,
        score: d.score,
        author: {
            name: d.name,
        },
    }))
    let unique = uniqBy(mapped, a => a.author.name)
    return unique
}
