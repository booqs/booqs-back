import { IResolvers } from '@graphql-tools/utils'
import { ResolverContext } from './context'
import { BooqParent } from './booq'
import { BooqHistoryParent } from './history'
import { CopilotInput, CopilotParent } from './copilot'
import { AuthorParent } from './author'
import { featuredBooqIds, libraryCardForId, libraryCardsForIds, searchBooqs } from '@/backend/library'
import { booqHistoryForUser } from '@/backend/history'
import { booqIdsInCollections } from '@/backend/collections'
import { userForId } from '@/backend/users'

type SearchResultParent = BooqParent | AuthorParent

export const queryResolver: IResolvers<unknown, ResolverContext> = {
    SearchResult: {
        __resolveType(parent: BooqParent | AuthorParent): 'Booq' | 'Author' {
            return parent.kind === 'author'
                ? 'Author'
                : 'Booq'
        },
    },
    Query: {
        ping() {
            return 'pong'
        },
        async booq(_, { id }): Promise<BooqParent | undefined> {
            return libraryCardForId(id)
        },
        author(_, { name }): AuthorParent {
            return { name, kind: 'author' }
        },
        async search(_, { query, limit }: {
            query: string,
            limit?: number,
        }): Promise<SearchResultParent[]> {
            const results = await searchBooqs(query, limit ?? 100)
            return results.map(
                r => r.kind === 'book'
                    ? r.card
                    : { ...r.author, kind: 'author' },
            )
        },
        async me(_, __, { userId }) {
            if (userId) {
                const user = await userForId(userId)
                return user ?? undefined
            } else {
                return undefined
            }
        },
        async history(_, __, { userId }): Promise<BooqHistoryParent[]> {
            const result = userId
                ? await booqHistoryForUser(userId)
                : []
            return result
        },
        async collection(_, { name }, { userId }) {
            return userId
                ? booqIdsInCollections(userId, name)
                : []
        },
        async featured(_, { limit }): Promise<Array<BooqParent | undefined>> {
            const ids = await featuredBooqIds(limit)
            return libraryCardsForIds(ids)
        },
        copilot(_, { context }: { context: CopilotInput }): CopilotParent {
            return context
        },
    },
}
