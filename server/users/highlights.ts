import { collection, DbUser, HighlightData } from './schema';

export type DbHighlight = HighlightData & { id: string };
export function userHighlights(user: DbUser, booqId: string): DbHighlight[] {
    return Object.entries(user.highlights ?? {}).map(([id, data]) => ({
        id,
        ...data,
    })).filter(hl => hl.booqId === booqId);
}

export async function addHighlight(
    userId: string,
    { id, ...data }: DbHighlight,
) {
    const result = await collection.findByIdAndUpdate(
        userId,
        {
            [`highlights.${id}`]: data,
        },
    ).exec();

    return result ? true : false;
}

export async function deleteHighlight(
    userId: string,
    { id }: Pick<DbHighlight, 'id'>,
) {
    const result = await collection.findByIdAndUpdate(
        userId,
        {
            $set: { [`highlights.${id}`]: '' },
        },
    ).exec();

    return result ? true : false;
}

export async function updateHighlight(
    userId: string,
    { id, group }: Pick<DbHighlight, 'id' | 'group'>,
) {
    const result = await collection.findByIdAndUpdate(
        userId,
        {
            $set: { [`highlights.${id}.group`]: group },
        },
    ).exec();

    return result ? true : false;
}
