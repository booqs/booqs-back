import { ApolloServer } from 'apollo-server';
import { config as configEnv } from 'dotenv';
import { typeDefs, resolvers } from './graphql';
import { log } from './utils';

configEnv();
startup();

async function startup() {
    const server = new ApolloServer({ typeDefs, resolvers });
    const { url } = await server.listen();
    log(`Server ready at ${url}`);
}
