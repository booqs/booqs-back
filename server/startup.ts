import { ApolloServer } from '@apollo/server'
import { readTypeDefs, resolvers, context } from './graphql'
import { booqsWorker } from './books'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { ApolloServerPluginSchemaReporting } from '@apollo/server/plugin/schemaReporting'
import { ApolloServerPluginUsageReporting } from '@apollo/server/plugin/usageReporting'
import http from 'http'
import cors from 'cors'
import express from 'express'
import bodyParser from 'body-parser'
import { mongoDbConnection } from './mongoose'

export async function startup() {
    mongoDbConnection()
    // Required logic for integrating with Express
    const app = express()
    // Our httpServer handles incoming requests to our Express app.
    // Below, we tell Apollo Server to "drain" this httpServer,
    // enabling our servers to shut down gracefully.
    const httpServer = http.createServer(app)

    // Same ApolloServer initialization as before, plus the drain plugin
    // for our httpServer.
    const server = new ApolloServer({
        typeDefs: await readTypeDefs(),
        resolvers,
        apollo: {
            graphVariant: process.env.NODE_ENV !== 'development'
                ? 'current' : 'dev',
        },
        plugins: [
            ApolloServerPluginDrainHttpServer({ httpServer }),
            ApolloServerPluginUsageReporting(),
            ApolloServerPluginSchemaReporting(),
        ],
    })
    // Ensure we wait for our server to start
    await server.start()

    // Set up our Express middleware to handle CORS, body parsing,
    // and our expressMiddleware function.
    app.use(
        '/graphql',
        cors<cors.CorsRequest>({
            origin(origin, callback) {
                // TODO: disallow undefined origin?
                if (!origin || origin?.endsWith('booqs.app') || origin?.endsWith('localhost:3000')) {
                    callback(null, true)
                } else {
                    callback(new Error(`${origin} is not allowed by CORS'`))
                }
            },
            credentials: true,
        }),
        bodyParser.json(),
        // expressMiddleware accepts the same arguments:
        // an Apollo Server instance and optional configuration options
        expressMiddleware(server, {
            context({ req, res }) {
                const parsed = parseCookies(req.headers.cookie ?? '')
                return context({
                    getCookie(name) { return parsed[name] },
                    setCookie(name, value, options) {
                        res.cookie(name, value, options ?? {})
                    },
                    clearCookie(name, options) {
                        res.cookie(name, '', {
                            ...options,
                            maxAge: 0,
                        })
                    },
                })
            },
        }),
    )

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

function parseCookies(cookie: string) {
    const pairs = cookie.split('; ')
    const result = pairs.reduce<{ [key: string]: string | undefined }>(
        (res, pair) => {
            const [name, value] = pair.split('=')
            res[name] = value
            return res
        },
        {},
    )
    return result
}
