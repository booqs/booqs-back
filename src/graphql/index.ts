import { gql, IResolvers } from 'apollo-server';
import { pgLib } from '../gutenberg';
import { auth } from '../auth';

export const typeDefs = gql`
type Card {
    title: String
    author: String
}
type AuthToken {
    token: String
}
type Query {
    auth(token: string, provider: String): AuthToken
    search(query: String): [Card]
}
`;

export const resolvers: IResolvers = {
    Query: {
        async search(_, { query }) {
            const results = await pgLib.search(query, 100);
            console.log(results);
            return results;
        },
        async auth(_, { token, provider }) {
            const authToken = await auth({
                provider,
                token,
            });
            return { token: authToken };
        },
    },
};
