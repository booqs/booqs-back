import { ApolloServer } from 'apollo-server';
import { config as configEnv } from 'dotenv';
import { typeDefs, resolvers } from './graphql';
import { log, connectDb } from './utils';

configEnv();
startup();

async function startup() {
    await connectDb(process.env.BACKEND_MONGODB_URI);

    const server = new ApolloServer({ typeDefs, resolvers });
    const { url } = await server.listen();
    log(`Server ready at ${url}`);
}
