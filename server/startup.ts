import { ApolloServer } from 'apollo-server'
import { typeDefs, resolvers, context } from './graphql'
import { connectDb } from './mongoose'
import { booqsWorker } from './books'

export async function startup() {
    connectDb()

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context,
        cors: {
            origin: true,
            credentials: true,
        },
        engine: {
            graphVariant: process.env.NODE_ENV !== 'development'
                ? 'current' : 'dev',
            reportSchema: true,
        },
    })
    const { url } = await server.listen({
        port: process.env.PORT || 4000,
    })
    console.info(`Server ready at ${url}`)
    runWorkers()
}

async function runWorkers() {
    if (process.env.RUN_WORKERS) {
        booqsWorker()
    }
}
