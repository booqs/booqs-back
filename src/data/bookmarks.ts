import { collection, DbUser, BookmarkData } from './schema';

export type DbBookmark = BookmarkData & { uuid: string };

export function userBookmarks(user: DbUser, booqId: string): DbBookmark[] {
    return Object.entries(user.bookmarks ?? {}).map(([uuid, data]) => ({
        uuid,
        ...data,
    })).filter(bm => bm.booqId === booqId);
}

export async function addBookmark(
    userId: string,
    { uuid, ...data }: DbBookmark,
) {
    const result = await collection.findByIdAndUpdate(
        userId,
        {
            [`bookmarks.${uuid}`]: data,
        },
    ).exec();

    return result ? true : false;
}

export async function deleteBookmark(
    userId: string,
    { uuid }: Pick<DbBookmark, 'uuid'>,
) {
    const result = await collection.findByIdAndUpdate(
        userId,
        {
            $unset: { [`bookmarks.${uuid}`]: '' },
        },
    ).exec();

    return result ? true : false;
}
