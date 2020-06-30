import { IResolvers } from 'apollo-server';
import { authWithToken } from '../auth';
import { users } from '../users';
import { search, forId, forIds, featuredIds } from '../books';
import { Context } from './context';
import { BooqParent } from './booq';
import { BooqHistoryParent } from './history';

export const queryResolver: IResolvers<any, Context> = {
    Query: {
        async booq(_, { id }): Promise<BooqParent | undefined> {
            return forId(id);
        },
        async search(_, { query, limit }): Promise<BooqParent[]> {
            const results = await search(query, limit ?? 100);
            return results;
        },
        async auth(_, { token, provider, name }, { setAuthToken }) {
            const result = await authWithToken({
                provider, token, name,
            });
            if (result) {
                setAuthToken(result.token);
                return {
                    token: result.token,
                    user: result.user,
                };
            } else {
                return undefined;
            }
        },
        logout(_, __, { setAuthToken }) {
            setAuthToken(undefined);
            return true;
        },
        history(_, __, { user }): BooqHistoryParent[] {
            const result = user
                ? users.userBooqHistory(user)
                : [];
            return result;
        },
        async collection(_, { name }, { user }) {
            return user
                ? users.userCollection(user, name)
                : [];
        },
        async featured(_, { limit }): Promise<Array<BooqParent | undefined>> {
            const ids = await featuredIds(limit);
            return forIds(ids);
        },
    },
};
