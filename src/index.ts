import { ApolloServer } from 'apollo-server';
import { config as configEnv } from 'dotenv';
import { typeDefs, resolvers, context } from './graphql';
import { syncWithS3 } from './gutenberg';
import { connectDb } from './mongoose';

configEnv();
startup();

async function startup() {
    const dbUri = process.env.BACKEND_MONGODB_URI;
    if (dbUri) {
        await connectDb(dbUri);
    } else {
        console.warn('BACKEND_MONGODB_URI is not set');
    }

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context,
    });
    const { url } = await server.listen();
    console.info(`Server ready at ${url}`);
    runWorkers();
}

async function runWorkers() {
    // eslint-disable-next-line no-constant-condition
    if (false) {
        syncWithS3();
    }
}
