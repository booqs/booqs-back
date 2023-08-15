import http from 'http'
import bodyParser from 'body-parser'
import { Express } from 'express'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { ApolloServerPluginSchemaReporting } from '@apollo/server/plugin/schemaReporting'
import { ApolloServerPluginUsageReporting } from '@apollo/server/plugin/usageReporting'
import { readTypeDefs, resolvers, context } from './graphql'
import { parseCookies } from './cookie'

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
        bodyParser.json(),
        // expressMiddleware accepts the same arguments:
        // an Apollo Server instance and optional configuration options
        expressMiddleware(server, {
            context({ req, res }) {
                const parsed = parseCookies(req.headers.cookie ?? '')
                return context({
                    getCookie(name) { return parsed[name] },
                    setCookie(name, value, options) {
                        console.log('domain', process.env.BOOQS_DOMAIN)
                        console.log('origin', req.headers.origin)
                        res.cookie(name, value, {
                            ...options,
                            domain: process.env.BOOQS_DOMAIN,
                        })
                    },
                    clearCookie(name, options) {
                        res.cookie(name, '', {
                            ...options,
                            domain: process.env.BOOQS_DOMAIN,
                            maxAge: 0,
                        })
                    },
                })
            },
        }),
    )
}
