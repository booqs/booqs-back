import { gql } from 'apollo-server';

export const typeDefs = gql`
type Query {
    dummy: [String]
}
`;

export const resolvers = {
    Query: {
        dummy: () => ['foo', 'bar'],
    },
};
