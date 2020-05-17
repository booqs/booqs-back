import { filterUndefined } from '../../core';
import { collection, DbUser } from './schema';
import { afterPrefix } from '../utils';

export type DbCollection = string[];
export function userCollection(user: DbUser, name: string): DbCollection {
    const result = filterUndefined(
        user.collections?.map(c => afterPrefix(c, `${name}:`)) ?? [],
    );
    return result;
}

export async function addToCollection(
    userId: string,
    name: string,
    booqId: string,
) {
    const result = await collection.findByIdAndUpdate(
        userId,
        {
            $addToSet: {
                collections: `${name}:${booqId}`,
            },
        },
    );
    return result ? true : false;
}

export async function removeFromCollection(
    userId: string,
    name: string,
    booqId: string,
) {
    const result = await collection.findByIdAndUpdate(
        userId,
        {
            $pull: {
                collections: `${name}:${booqId}`,
            },
        },
    );
    return result ? true : false;
}

export async function addUpload(userId: string, uploadId: string) {
    return addToCollection(userId, 'uploads', `uu/${uploadId}`);
}
