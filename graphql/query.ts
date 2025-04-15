import { IResolvers } from '@graphql-tools/utils'
import { ResolverContext } from './context'
import { BooqParent } from './booq'
import { BooqHistoryParent } from './history'
import { CopilotInput, CopilotParent } from './copilot'
import { AuthorParent } from './author'
import { featuredBooqIds, libraryCardForId, libraryCardsForIds, searchBooqs, SearchScope } from '@/backend/library'
import { userBooqHistory, userCollection } from '@/backend/users'

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
        async search(_, { query, limit, scope }: {
            query: string,
            limit?: number,
            scope?: string[],
        }): Promise<SearchResultParent[]> {
            const actualScope = (scope ?? ['title', 'author', 'subject'])
                .filter((s): s is SearchScope => ['title', 'author', 'subject'].includes(s))
            const results = await searchBooqs(query, limit ?? 100, actualScope)
            return results.map(
                r => r.kind === 'book'
                    ? r.card
                    : { ...r.author, kind: 'author' },
            )
        },
        async me(_, __, { user }) {
            return user
        },
        history(_, __, { user }): BooqHistoryParent[] {
            const result = user
                ? userBooqHistory(user)
                : []
            return result
        },
        async collection(_, { name }, { user }) {
            return user
                ? userCollection(user, name)
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
