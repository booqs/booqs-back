import { ApolloServer } from 'apollo-server';
import { config as configEnv } from 'dotenv';
import { typeDefs, resolvers } from './graphql';
import { log } from './utils';
import { syncWithS3 } from './gutenberg';
import { connectDb } from './mongoose';

configEnv();
startup();

async function startup() {
    const dbUri = process.env.BACKEND_MONGODB_URI;
    if (dbUri) {
        await connectDb(dbUri);
    } else {
        log('BACKEND_MONGODB_URI is not set');
    }

    const server = new ApolloServer({ typeDefs, resolvers });
    const { url } = await server.listen();
    log(`Server ready at ${url}`);
    runWorkers();
}

async function runWorkers() {
    syncWithS3();
}
