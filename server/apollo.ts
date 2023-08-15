import http from 'http'
import cors from 'cors'
import bodyParser from 'body-parser'
import { Express } from 'express'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { ApolloServerPluginSchemaReporting } from '@apollo/server/plugin/schemaReporting'
import { ApolloServerPluginUsageReporting } from '@apollo/server/plugin/usageReporting'
import { readTypeDefs, resolvers, context } from './graphql'

export async function createApolloServer(httpServer: http.Server) {
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
    return server
}


export function addApolloHandler(app: Express, route: string, server: ApolloServer) {
    // Set up our Express middleware to handle CORS, body parsing,
    // and our expressMiddleware function.
    app.use(
        route,
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
