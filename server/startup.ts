import { ApolloServer } from 'apollo-server';
import { typeDefs, resolvers, context } from './graphql';
import { connectDb } from './mongoose';
import { booqsWorker } from './books';

export async function startup() {
    connectDb();

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context,
        cors: true,
    });
    const { url } = await server.listen({
        port: process.env.PORT || 4000,
    });
    console.info(`Server ready at ${url}`);
    runWorkers();
}

async function runWorkers() {
    // eslint-disable-next-line no-constant-condition
    if (true) {
        booqsWorker();
    }
}
