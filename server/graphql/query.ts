import { IResolvers } from 'apollo-server';
import { authWithToken } from '../auth';
import { userBooqHistory, userCollection } from '../users';
import { search, forId, forIds, featuredIds } from '../books';
import { Context } from './context';
import { BooqParent } from './booq';
import { BooqHistoryParent } from './history';

export const queryResolver: IResolvers<any, Context> = {
    Query: {
        async booq(_, { id }): Promise<BooqParent | undefined> {
            return forId(id);
        },
        async search(_, { query }): Promise<BooqParent[]> {
            const results = await search(query, 100);
            return results;
        },
        async auth(_, { token, provider }) {
            const result = await authWithToken({
                provider,
                token,
            });
            if (result) {
                return {
                    token: result.token,
                    name: result.user.name,
                    profilePicture: result.user.pictureUrl,
                };
            } else {
                return undefined;
            }
        },
        async history(_, __, { user }): Promise<BooqHistoryParent[]> {
            return user
                ? userBooqHistory(user)
                : [];
        },
        async collection(_, { name }, { user }) {
            return user
                ? userCollection(user, name)
                : [];
        },
        async featured(_, { limit }): Promise<Array<BooqParent | undefined>> {
            const ids = await featuredIds(limit);
            return forIds(ids);
        },
    },
};
