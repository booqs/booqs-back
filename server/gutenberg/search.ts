import { pgCards } from './schema'
import { LibraryCard } from '../sources'

export async function search(query: string, limit: number): Promise<LibraryCard[]> {
    return (await pgCards).aggregate([{
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
                    // {
                    //     term: {
                    //         query,
                    //         path: 'subjects',
                    //         fuzzy: {},
                    //         score: { boost: { value: 0.1 } },
                    //     },
                    // },
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
}
