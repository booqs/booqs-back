import { IResolvers } from '@graphql-tools/utils'
import { DbBookmark } from '@/backend/users'
import { libraryCardForId } from '@/backend/library'
import { BooqParent } from './booq'

export type BookmarkParent = DbBookmark
export const bookmarkResolver: IResolvers<BookmarkParent> = {
    Bookmark: {
        async booq(parent): Promise<BooqParent | undefined> {
            return libraryCardForId(parent.booqId)
        },
    },
}
