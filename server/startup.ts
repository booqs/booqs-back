import { ApolloServer } from 'apollo-server';
import { typeDefs, resolvers, context } from './graphql';
import { syncWithS3 } from './gutenberg';
import { connectDb } from './mongoose';

export async function startup() {
    connectDb();

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context,
        cors: true,
    });
    const { url } = await server.listen();
    console.info(`Server ready at ${url}`);
    runWorkers();
}

async function runWorkers() {
    // eslint-disable-next-line no-constant-condition
    if (true) {
        syncWithS3();
    }
}
