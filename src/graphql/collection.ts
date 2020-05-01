import { IResolvers } from 'apollo-server';
import { filterUndefined } from 'booqs-core';
import { afterPrefix } from '../utils';
import { pgLib } from '../gutenberg';

export type CollectionParent = string[];
export const collectionResolver: IResolvers<CollectionParent> = {
    Collection: {
        books(parent) {
            const pgIds = filterUndefined(
                parent.map(p => afterPrefix(p, 'pg/')),
            );
            return pgLib.forIds(pgIds);
        },
    },
};
