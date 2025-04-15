import { pgCards } from './schema'
import { SearchResult, SearchScope } from '../sources'
import { uniqBy } from 'lodash'

export async function search(query: string, limit: number, scope: SearchScope[]): Promise<ScoredSearch[]> {
    const promises: Promise<ScoredSearch[]>[] = []
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
    const allResults = (await Promise.all(promises)).flat()
    const sorted = allResults.sort((a, b) => b.score - a.score).slice(0, limit)
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
    const cursor = (await pgCards).aggregate([
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
    const docs = await cursor.exec()
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
    const cursor = (await pgCards).aggregate([
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
    const docs = await cursor.exec()
    const mapped = docs.map(d => ({
        kind: 'author' as const,
        score: d.score,
        author: {
            name: d.name,
        },
    }))
    const unique = uniqBy(mapped, a => a.author.name)
    return unique
}
