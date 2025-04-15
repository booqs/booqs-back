import { collection, DbUser, BookmarkData } from './schema'

export type DbBookmark = BookmarkData & { id: string }

export function userBookmarks(user: DbUser, booqId: string): DbBookmark[] {
    return Object.entries(user.bookmarks ?? {}).map(([id, data]) => ({
        id,
        ...data,
    })).filter(bm => bm.booqId === booqId)
}

export async function addBookmark(
    userId: string,
    { id, ...data }: DbBookmark,
) {
    const result = await (await collection).findByIdAndUpdate(
        userId,
        {
            [`bookmarks.${id}`]: data,
        },
    ).exec()

    return result ? true : false
}

export async function deleteBookmark(
    userId: string,
    { id }: Pick<DbBookmark, 'id'>,
) {
    const result = await (await collection).findByIdAndUpdate(
        userId,
        {
            $unset: { [`bookmarks.${id}`]: '' },
        },
    ).exec()

    return result ? true : false
}
