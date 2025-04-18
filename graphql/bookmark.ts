import { IResolvers } from '@graphql-tools/utils'
import { libraryCardForId } from '@/backend/library'
import { BooqParent } from './booq'
import { DbBookmark } from '@/backend/bookmarks'

export type BookmarkParent = DbBookmark
export const bookmarkResolver: IResolvers<BookmarkParent> = {
    Bookmark: {
        async booq(parent): Promise<BooqParent | undefined> {
            return libraryCardForId(parent.booq_id)
        },
    },
}
