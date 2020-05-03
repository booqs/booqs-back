import { IResolvers } from 'apollo-server';
import { forIds } from '../books';
import { BooqParent } from './booq';

export type CollectionParent = string[];
export const collectionResolver: IResolvers<CollectionParent> = {
    Collection: {
        async booqs(parent): Promise<Array<BooqParent | undefined>> {
            return forIds(parent);
        },
    },
};
