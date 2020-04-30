import { IResolvers } from 'apollo-server';
import { pgLib } from '../gutenberg';
import { getAuthToken } from '../auth';
import { bookmarks } from '../data';
import { Context } from './context';
import { BookmarkParent } from './bookmark';

export const queryResolver: IResolvers<any, Context> = {
    Query: {
        async search(_, { query }) {
            const results = await pgLib.search(query, 100);
            return results;
        },
        async auth(_, { token, provider }) {
            const authToken = await getAuthToken({
                provider,
                token,
            });
            return { token: authToken };
        },
        async bookmarks(_, { booqId }, context): Promise<BookmarkParent[]> {
            if (context.user?._id) {
                return bookmarks.forBook(context.user?._id, booqId.id, booqId.source);
            } else {
                return [];
            }
        },
    },
};
