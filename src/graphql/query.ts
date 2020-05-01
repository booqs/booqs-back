import { IResolvers } from 'apollo-server';
import { pgLib } from '../gutenberg';
import { getAuthToken } from '../auth';
import { Context } from './context';
import { BookmarkParent } from './bookmark';
import { CardParent } from './card';
import { HighlightParent } from './highlight';
import { userBookmarks, userHighlights, userCurrents } from '../data';

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
        async bookmarks(_, { booqId }, { user }): Promise<BookmarkParent[]> {
            return user
                ? userBookmarks(user, booqId)
                : [];
        },
        async highlights(_, { booqId }, { user }): Promise<HighlightParent[]> {
            return user
                ? userHighlights(user, booqId)
                : [];
        },
        async currents(_, __, { user }) {
            return user
                ? userCurrents(user)
                : [];
        },
    },
};
