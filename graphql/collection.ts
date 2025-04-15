import { IResolvers } from '@graphql-tools/utils'
import { BooqParent } from './booq'
import { libraryCardsForIds } from '@/backend/library'
import { filterUndefined } from '@/core'

export type CollectionParent = string[]
export const collectionResolver: IResolvers<CollectionParent> = {
    Collection: {
        async booqs(parent): Promise<BooqParent[]> {
            return libraryCardsForIds(parent)
                .then(filterUndefined)
        },
    },
}
