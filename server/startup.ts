import { ApolloServer } from '@apollo/server'
import { typeDefs, resolvers, context } from './graphql'
import { connectDb } from './mongoose'
import { booqsWorker } from './books'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import http from 'http'
import cors from 'cors'
import express from 'express'
import bodyParser from 'body-parser'

export async function startup() {
    const db = connectDb()

    // Required logic for integrating with Express
    const app = express()
    // Our httpServer handles incoming requests to our Express app.
    // Below, we tell Apollo Server to "drain" this httpServer,
    // enabling our servers to shut down gracefully.
    const httpServer = http.createServer(app)

    // Same ApolloServer initialization as before, plus the drain plugin
    // for our httpServer.
    const server = new ApolloServer({
        typeDefs,
        resolvers,
        // TODO: migrate to Apollo Studio
        // engine: {
        //     graphVariant: process.env.NODE_ENV !== 'development'
        //         ? 'current' : 'dev',
        //     reportSchema: true,
        // },
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    })
    // Ensure we wait for our server to start
    await server.start()

    // Set up our Express middleware to handle CORS, body parsing,
    // and our expressMiddleware function.
    app.use(
        '/graphql',
        cors<cors.CorsRequest>({
            origin: '*',
            credentials: true,
        }),
        bodyParser.json(),
        // expressMiddleware accepts the same arguments:
        // an Apollo Server instance and optional configuration options
        expressMiddleware(server, {
            context,
        }),
    )

    await db
    // Modified server startup
    const port = process.env.PORT
        ? parseInt(process.env.PORT)
        : 4000
    await new Promise<void>((resolve) => httpServer.listen({ port }, resolve))
    console.log(`🚀 Server ready at http://localhost:${port}/`)

    runWorkers()
}

async function runWorkers() {
    if (process.env.RUN_WORKERS) {
        booqsWorker()
    }
}
