import http from 'http'
import express from 'express'
import cors from 'cors'
import { addUploadHandler } from './upload'
import { addApolloHandler, createApolloServer } from './apollo'
import { mongoDbConnection } from '@/backend/mongoose'
import { config } from '@/backend/config'
import { pgSyncWorker } from '@/backend/sync'


export async function startup() {
    const mongoPromise = mongoDbConnection()

    const app = express()

    const httpServer = http.createServer(app)
    const apolloServer = await createApolloServer(httpServer)
    await apolloServer.start()

    addLoggingHandler(app)
    addCorsHandler(app, Object.values(config().origins))
    addApolloHandler(app, '/graphql', apolloServer)
    addUploadHandler(app, '/upload')

    // Modified server startup
    const port = process.env.PORT
        ? parseInt(process.env.PORT)
        : 4000
    const listenPromise = new Promise<void>((resolve) => httpServer.listen({ port }, resolve))
    await Promise.all([mongoPromise, listenPromise])
    console.log(`🚀 Server ready at http://localhost:${port}/`)

    runWorkers()
}

function addLoggingHandler(app: express.Express) {
    // app.use((req, res, next) => {
    //     console.log(`${req.method} ${req.url}`)
    //     next()
    // })
    app.use((req, res, next) => {
        res.on('finish', () => {
            if (res.statusCode >= 400) {
                console.log(`Error on ${req.method} ${req.url}`)
                console.error('Body', req.body)
                console.error(`Response: ${res.statusCode} ${res.statusMessage}`)
            }
        })
        next()
    })
    app.use((req, res, next) => {
        res.on('error', (err) => {
            console.error(`Response error: ${err}`)
        })
        next()
    })
}

function addCorsHandler(app: express.Express, allowedOrigins: Array<string | undefined>) {
    app.use(cors<cors.CorsRequest>({
        origin(origin, callback) {
            for (const allowed of allowedOrigins) {
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
        pgSyncWorker()
    }
}
