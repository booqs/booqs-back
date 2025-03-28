import http from 'http'
import bodyParser from 'body-parser'
import { Express } from 'express'
import { ApolloServer, ApolloServerPlugin } from '@apollo/server'
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
            ApolloServerPluginLogging(),
        ],
    })
    return server
}

export function ApolloServerPluginLogging(): ApolloServerPlugin {
    return {
        async requestDidStart() {
            return {
                // async didResolveOperation({ request }) {
                //     console.log('Request:', request.query)
                // },
                async didEncounterErrors({ errors }) {
                    console.error('Errors:', errors)
                },
            }
        },
    }
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
                const origin = req.headers.origin
                let domain: string | undefined = origin?.startsWith('https://') ? origin.substring('https://'.length)
                    : origin?.startsWith('http://') ? origin.substring('http://'.length)
                        : (process.env.APP_DOMAIN ?? 'booqs.app')
                if (domain.startsWith('localhost')) {
                    domain = undefined
                }
                return context({
                    origin,
                    getCookie(name) { return parsed[name] },
                    setCookie(name, value, options) {
                        res.cookie(name, value, {
                            ...options,
                            domain,
                        })
                    },
                    clearCookie(name, options) {
                        res.cookie(name, '', {
                            ...options,
                            domain,
                            maxAge: 0,
                        })
                    },
                })
            },
        }),
    )
}
