import http from 'http'
import express from 'express'
import cors from 'cors'
import { booqsWorker } from './books'
import { mongoDbConnection } from './mongoose'
import { addUploadHandler } from './upload'
import { addApolloHandler, createApolloServer } from './apollo'
import { config } from './config'

export async function startup() {
    let mongoPromise = mongoDbConnection()
    // Required logic for integrating with Express
    const app = express()
    // Our httpServer handles incoming requests to our Express app.
    // Below, we tell Apollo Server to "drain" this httpServer,
    // enabling our servers to shut down gracefully.
    const httpServer = http.createServer(app)
    const apolloServer = await createApolloServer(httpServer)
    await apolloServer.start()
    addCorsHandler(app, Object.values(config().origins))
    addApolloHandler(app, '/graphql', apolloServer)
    addUploadHandler(app, '/upload')

    // Modified server startup
    const port = process.env.PORT
        ? parseInt(process.env.PORT)
        : 4000
    let listenPromise = new Promise<void>((resolve) => httpServer.listen({ port }, resolve))
    await Promise.all([mongoPromise, listenPromise])
    console.log(`🚀 Server ready at http://localhost:${port}/`)

    runWorkers()
}

function addCorsHandler(app: express.Express, allowedOrigins: Array<string | undefined>) {
    app.use(cors<cors.CorsRequest>({
        origin(origin, callback) {
            for (let allowed of allowedOrigins) {
                if (origin === allowed) {
                    callback(null, true)
                    return
                }
            }
            callback(new Error(`${origin} is not allowed by CORS'`))
        },
        credentials: true,
    }))
}

async function runWorkers() {
    if (process.env.RUN_WORKERS) {
        booqsWorker()
    }
}
