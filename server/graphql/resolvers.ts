import { IResolvers } from '@graphql-tools/utils'
import GraphQLJSON from 'graphql-type-json'
import { queryResolver } from './query'
import { mutationResolver } from './mutation'
import { collectionResolver } from './collection'
import { booqResolver } from './booq'
import { booqHistoryResolver } from './history'
import { bookmarkResolver } from './bookmark'
import { highlightResolver } from './highlight'
import { userResolver } from './user'
import { copilotResolver } from './copilot'

export const resolvers: IResolvers = {
    ...queryResolver,
    ...mutationResolver,
    ...collectionResolver,
    ...booqResolver,
    ...booqHistoryResolver,
    ...bookmarkResolver,
    ...highlightResolver,
    ...userResolver,
    ...copilotResolver,
    BooqNode: GraphQLJSON,
}
