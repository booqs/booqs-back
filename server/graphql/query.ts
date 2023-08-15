import { IResolvers } from '@graphql-tools/utils'
import { users } from '../users'
import { search, forId, forIds, featuredIds } from '../books'
import { ResolverContext } from './context'
import { BooqParent } from './booq'
import { BooqHistoryParent } from './history'
import { CopilotInput, CopilotParent } from './copilot'
import { SearchScope } from '../sources'
import { AuthorParent } from './author'

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
        async booq(_, { id }): Promise<BooqParent | undefined> {
            return forId(id)
        },
        author(_, { name }): AuthorParent {
            return { name, kind: 'author' }
        },
        async search(_, { query, limit, scope }: {
            query: string,
            limit?: number,
            scope?: string[],
        }): Promise<SearchResultParent[]> {
            let actualScope = (scope ?? ['title', 'author', 'subject'])
                .filter((s): s is SearchScope => ['title', 'author', 'subject'].includes(s))
            const results = await search(query, limit ?? 100, actualScope)
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
                ? users.userBooqHistory(user)
                : []
            return result
        },
        async collection(_, { name }, { user }) {
            if (!user) {
                console.warn('Collection query without user')
            } else {
                console.log('Collection query for user', user)
            }
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
