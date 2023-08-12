import { IResolvers } from '@graphql-tools/utils'
import { users } from '../users'
import { search, forId, forIds, featuredIds } from '../books'
import { ResolverContext } from './context'
import { BooqParent } from './booq'
import { BooqHistoryParent } from './history'
import { CopilotInput, CopilotParent } from './copilot'

export const queryResolver: IResolvers<unknown, ResolverContext> = {
    Query: {
        async booq(_, { id }): Promise<BooqParent | undefined> {
            return forId(id)
        },
        async search(_, { query, limit }): Promise<BooqParent[]> {
            const results = await search(query, limit ?? 100)
            return results
        },
        async me(_, __, { user }) {
            return user
        },
        history(_, __, { user }): BooqHistoryParent[] {
            const result = user
                ? users.userBooqHistory(user)
                : []
            return result
        },
        async collection(_, { name }, { user }) {
            return user
                ? users.userCollection(user, name)
                : []
        },
        async featured(_, { limit }): Promise<Array<BooqParent | undefined>> {
            const ids = await featuredIds(limit)
            return forIds(ids)
        },
        copilot(_, { context }: { context: CopilotInput }): CopilotParent {
            return context
        },
    },
}
