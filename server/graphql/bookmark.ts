import { IResolvers } from '@graphql-tools/utils'
import { DbBookmark } from '../users'
import { forId } from '../books'
import { BooqParent } from './booq'

export type BookmarkParent = DbBookmark
export const bookmarkResolver: IResolvers<BookmarkParent> = {
    Bookmark: {
        async booq(parent): Promise<BooqParent | undefined> {
            return forId(parent.booqId)
        },
    },
}
