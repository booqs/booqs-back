import { IResolvers } from 'apollo-server';
import { pgLib } from '../gutenberg';
import { getAuthToken } from '../auth';
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
            return context.user
                ?.bookmarks
                ?.filter(bm => bm.booqId === booqId)
                ?? [];
        },
        async highlights(_, { booqId }, context): Promise<HighlightParent[]> {
            return context.user
                ?.highlights
                ?.filter(hl => hl.booqId === booqId)
                ?? [];
        },
        async currents(_, __, context) {
            return context.user
                ?.currents
                ?? [];
        },
    },
};
