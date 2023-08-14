import { uuCards } from './schema'
import { SearchResult } from '../sources'

export async function search(query: string, limit: number): Promise<SearchResult[]> {
    let docs = await (await uuCards).aggregate([{
        $search: {
            compound: {
                should: [
                    {
                        text: {
                            query,
                            path: 'title',
                            fuzzy: {},
                            score: { boost: { value: 1.1 } },
                        },
                    },
                    {
                        text: {
                            query,
                            path: 'author',
                            fuzzy: {},
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
        },
    },
    ]).exec()
    return docs.map((doc) => ({
        kind: 'book',
        card: doc,
    }))
}
