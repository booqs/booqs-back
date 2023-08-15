import http from 'http'
import express from 'express'
import { booqsWorker } from './books'
import { mongoDbConnection } from './mongoose'
import { addUploadHandler } from './upload'
import { addApolloHandler, createApolloServer } from './apollo'

export async function startup() {
    mongoDbConnection()
    // Required logic for integrating with Express
    const app = express()
    // Our httpServer handles incoming requests to our Express app.
    // Below, we tell Apollo Server to "drain" this httpServer,
    // enabling our servers to shut down gracefully.
    const httpServer = http.createServer(app)
    const apolloServer = await createApolloServer(httpServer)
    await apolloServer.start()
    addApolloHandler(app, '/graphql', apolloServer)
    addUploadHandler(app, '/upload')

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
