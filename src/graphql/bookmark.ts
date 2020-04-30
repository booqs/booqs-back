import { IResolvers } from 'apollo-server';
import { BooqId } from 'booqs-core';
import { DbBookmark } from '../data';

export type BookmarkParent = DbBookmark;
export const bookmarkResolver: IResolvers<BookmarkParent> = {
    Bookmark: {
        booqId(parent): BooqId {
            return {
                id: parent.bookId,
                source: parent.bookSource,
            };
        },
    },
};
