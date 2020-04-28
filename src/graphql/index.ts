import { gql, IResolvers } from 'apollo-server';
import { pgLib } from '../gutenberg';

export const typeDefs = gql`
type Card {
    title: String
    author: String
}
type Query {
    search(query: String): [Card]
}
`;

export const resolvers: IResolvers = {
    Query: {
        async search(_, args) {
            const results = await pgLib.search(args.query, 100);
            console.log(results);
            return results;
        },
    },
};
