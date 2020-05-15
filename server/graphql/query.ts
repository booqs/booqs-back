import { IResolvers } from 'apollo-server';
import { authWithToken } from '../auth';
import {
    userCurrents, userCollection,
} from '../data';
import { search, forIds, featuredIds } from '../books';
import { Context } from './context';
import { BooqParent } from './booq';

export const queryResolver: IResolvers<any, Context> = {
    Query: {
        async booq(_, { id }): Promise<BooqParent | undefined> {
            const [result] = await forIds([id]);
            return result;
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
        async currents(_, __, { user }) {
            return user
                ? userCurrents(user)
                : [];
        },
        async collection(_, { name }, { user }) {
            return user
                ? userCollection(user, name)
                : [];
        },
        async featured(_, { limit }) {
            const ids = await featuredIds(limit);
            return forIds(ids);
        },
    },
};
