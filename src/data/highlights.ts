import { DbHighlight, collection, DbUser } from './schema';

export function userHighlights(user: DbUser, booqId: string) {
    return user.highlights?.filter(h => h.booqId === booqId) ?? [];
}

export async function addHighlight(
    userId: string,
    element: DbHighlight,
) {
    const result = await collection.findByIdAndUpdate(
        userId,
        { $push: { highlights: element } },
    ).exec();

    return result ? true : false;
}

export async function deleteHighlight(
    userId: string,
    element: Pick<DbHighlight, 'uuid'>,
) {
    const result = await collection.findByIdAndUpdate(
        userId,
        { $pull: { highlights: element } },
    ).exec();

    return result ? true : false;
}
