import { IResolvers } from '@graphql-tools/utils'
import { BooqParent } from './booq'
import { booqsForAuthor } from '@/backend/library'

export type AuthorParent = {
    name: string,
    kind: 'author',
}
export const authorResolver: IResolvers<AuthorParent> = {
    Author: {
        async booqs(parent, { limit, offset }): Promise<BooqParent[]> {
            return booqsForAuthor(parent.name, limit, offset)
        },
    },
}
