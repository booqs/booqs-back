import { BooqPath } from 'booqs-core';
import { collection, DbUser } from './schema';

export type DbBookmark = {
    uuid: string,
    booqId: string,
    path: BooqPath,
};

export function userBookmarks(user: DbUser, booqId: string): DbBookmark[] {
    return Object.entries(user.bookmarks ?? {}).map(([uuid, data]) => ({
        uuid,
        ...data,
    })).filter(bm => bm.booqId === booqId);
}

export async function addBookmark(
    userId: string,
    { uuid, booqId, path }: DbBookmark,
) {
    const result = await collection.findByIdAndUpdate(
        userId,
        {
            [`bookmarks.${uuid}`]: { booqId, path },
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
