import { IResolvers } from '@graphql-tools/utils'
import { BooqParent } from './booq'
import { libraryCardsForIds } from '@/backend/library'
import { filterUndefined } from '@/core'

export type CollectionParent = {
    name: string
    ids: string[],
}
export const collectionResolver: IResolvers<CollectionParent> = {
    Collection: {
        name(parent): string {
            return parent.name
        },
        async booqs(parent): Promise<BooqParent[]> {
            return libraryCardsForIds(parent.ids)
                .then(filterUndefined)
        },
    },
}
