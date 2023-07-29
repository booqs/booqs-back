import { ApolloServer } from 'apollo-server-micro'
import { config as configEnv } from 'dotenv'
import { typeDefs, resolvers, context } from './graphql'
import { connectDb } from './mongoose'

configEnv()

let microServer: ApolloServer
export function createHandler(path: string) {
    connectDb()
    if (!microServer) {
        microServer = new ApolloServer({
            typeDefs,
            resolvers,
            context,
        })
    }

    return microServer.createHandler({ path })
}
