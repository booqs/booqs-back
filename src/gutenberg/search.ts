import { collection, DbPgCard } from './collection';

export async function search(query: string, limit: number): Promise<DbPgCard[]> {
    return collection.aggregate([{
        $searchBeta: {
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
    }]).exec();
}
