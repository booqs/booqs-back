import { IResolvers } from '@graphql-tools/utils'
import { BooqParent } from './booq'
import { forAuthor } from '../books'

export type AuthorParent = {
    name: string,
}
export const authorResolver: IResolvers<AuthorParent> = {
    Author: {
        async booqs(parent, { limit, offset }): Promise<BooqParent[]> {
            return forAuthor(parent.name, limit, offset)
        },
    },
}
