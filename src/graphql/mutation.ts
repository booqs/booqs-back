import { IResolvers } from 'apollo-server';
import { bookmarks, highlights } from '../data';
import { Context } from './context';

export const mutationResolver: IResolvers<any, Context> = {
    Mutation: {
        async addBookmark(_, { bm }, context) {
            if (context.user?._id) {
                return bookmarks.addBookmark({
                    accountId: context.user?._id,
                    uuid: bm.uuid,
                    booqId: bm.booqId,
                    path: bm.path,
                });
            } else {
                return undefined;
            }
        },
        async addHighlight(_, { hl }, context) {
            if (context.user?._id) {
                return highlights.addHighlight({
                    accountId: context.user?._id,
                    uuid: hl.uuid,
                    booqId: hl.booqId,
                    start: hl.start,
                    end: hl.end,
                    group: hl.group,
                });
            } else {
                return undefined;
            }
        },
    },
};
