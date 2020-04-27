import { ApolloServer } from 'apollo-server';
import { typeDefs, resolvers } from './graphql';
import { log } from './utils';

async function startup() {
    const server = new ApolloServer({ typeDefs, resolvers });
    const { url } = await server.listen();
    log(`Server ready at ${url}`);
}

startup();
