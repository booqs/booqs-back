import { gql, IResolvers } from 'apollo-server';
import { pgLib } from '../gutenberg';
import { getAuthToken, fromHeader } from '../auth';

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
            const authToken = await getAuthToken({
                provider,
                token,
            });
            return { token: authToken };
        },
    },
};

type Context = {
    req: {
        headers: {
            authorization?: string,
        },
    },
};
export async function context(context: Context) {
    const header = context.req.headers.authorization ?? '';
    const user = fromHeader(header);
    return { user };
}
