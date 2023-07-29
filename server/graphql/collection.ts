import { IResolvers } from '@graphql-tools/utils'
import { filterUndefined } from '../../core'
import { forIds } from '../books'
import { BooqParent } from './booq'

export type CollectionParent = string[];
export const collectionResolver: IResolvers<CollectionParent> = {
    Collection: {
        async booqs(parent): Promise<BooqParent[]> {
            return forIds(parent)
                .then(filterUndefined)
        },
    },
}
