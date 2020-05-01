import { IResolvers } from 'apollo-server';
import { forIds } from '../books';

export type CollectionParent = string[];
export const collectionResolver: IResolvers<CollectionParent> = {
    Collection: {
        books(parent) {
            return forIds(parent);
        },
    },
};
