import { collection, DbUser, HighlightData } from './schema';

export type DbHighlight = HighlightData & { uuid: string };
export function userHighlights(user: DbUser, booqId: string): DbHighlight[] {
    return Object.entries(user.highlights ?? {}).map(([uuid, data]) => ({
        uuid,
        ...data,
    })).filter(hl => hl.booqId === booqId);
}

export async function addHighlight(
    userId: string,
    { uuid, ...data }: DbHighlight,
) {
    const result = await collection.findByIdAndUpdate(
        userId,
        {
            [`highlights.${uuid}`]: data,
        },
    ).exec();

    return result ? true : false;
}

export async function deleteHighlight(
    userId: string,
    { uuid }: Pick<DbHighlight, 'uuid'>,
) {
    const result = await collection.findByIdAndUpdate(
        userId,
        {
            $unset: { [`highlights.${uuid}`]: '' },
        },
    ).exec();

    return result ? true : false;
}
