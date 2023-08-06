import { ApolloServer } from '@apollo/server'
import { mongoDbConnection } from './mongoose'
import { readTypeDefs, resolvers } from './graphql'

let _server: Promise<ApolloServer> | undefined
export async function prepareServer() {
    mongoDbConnection()
    if (!_server) {
        _server = createServer()
        return _server
    } else {
        return _server
    }
}

async function createServer() {
    return new ApolloServer({
        typeDefs: await readTypeDefs(),
        resolvers,
        apollo: {
            graphVariant: process.env.NODE_ENV !== 'development'
                ? 'current' : 'dev',
        },
    })
}