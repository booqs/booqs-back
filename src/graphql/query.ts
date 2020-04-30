import { IResolvers } from 'apollo-server';
import { pgLib } from '../gutenberg';
import { getAuthToken } from '../auth';
import { bookmarks, highlights } from '../data';
import { Context } from './context';
import { BookmarkParent } from './bookmark';
import { CardParent } from './card';
import { HighlightParent } from './highlight';

export const queryResolver: IResolvers<any, Context> = {
    Query: {
        async search(_, { query }): Promise<CardParent[]> {
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
                return bookmarks.forBook({
                    accountId: context.user?._id,
                    bookId: booqId.id,
                    bookSource: booqId.source,
                });
            } else {
                return [];
            }
        },
        async highlights(_, { booqId }, context): Promise<HighlightParent[]> {
            if (context.user?._id) {
                return highlights.forBook({
                    accountId: context.user?._id,
                    bookId: booqId.id,
                    bookSource: booqId.source,
                });
            } else {
                return [];
            }
        },
    },
};
