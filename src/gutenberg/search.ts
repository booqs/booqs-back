import { cards, Card } from './schema';

export async function search(query: string, limit: number): Promise<Card[]> {
    return cards.aggregate([{
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
