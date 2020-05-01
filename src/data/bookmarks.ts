import { DbBookmark, collection, DbUser } from './schema';

export function userBookmarks(user: DbUser, booqId: string) {
    return user.bookmarks?.filter(b => b.booqId === booqId) ?? [];
}

export async function addBookmark(
    userId: string,
    element: DbBookmark,
) {
    const result = await collection.findByIdAndUpdate(
        userId,
        { $push: { bookmarks: element } },
    ).exec();

    return result ? true : false;
}

export async function deleteBookmark(
    userId: string,
    element: Pick<DbBookmark, 'uuid'>,
) {
    const result = await collection.findByIdAndUpdate(
        userId,
        { $pull: { bookmarks: element } },
    ).exec();

    return result ? true : false;
}