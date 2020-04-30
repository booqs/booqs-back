import { IResolvers } from 'apollo-server';
import { bookmarks, highlights } from '../data';
import { Context } from './context';

export const mutationResolver: IResolvers<any, Context> = {
    Mutation: {
        async addBookmark(_, { bm }, context) {
            if (context.user?._id) {
                return bookmarks.addBookmark(
                    context.user?._id,
                    {
                        uuid: bm.uuid,
                        bookId: bm.booqId.id,
                        bookSource: bm.booqId.source,
                        path: bm.path,
                    },
                );
            } else {
                return undefined;
            }
        },
        async addHighlight(_, { hl }, context) {
            if (context.user?._id) {
                return highlights.addHighlight(
                    context.user?._id,
                    {
                        uuid: hl.uuid,
                        bookId: hl.booqId.id,
                        bookSource: hl.booqId.source,
                        start: hl.start,
                        end: hl.end,
                        group: hl.group,
                    },
                );
            } else {
                return undefined;
            }
        },
    },
};
