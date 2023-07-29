import { uniq } from 'lodash'
import { filterUndefined } from '../../core'
import { collection, DbUser } from './schema'
import { afterPrefix } from '../utils'

export type DbCollection = string[];
export function userCollection(user: DbUser, name: string): DbCollection {
    switch (name) {
        case 'my-books':
            return combineCollections([
                namedCollection(user, 'my-books'),
                namedCollection(user, 'uploads'),
            ])
        default:
            return namedCollection(user, name)
    }
}

function namedCollection(user: DbUser, name: string): DbCollection {
    const result = filterUndefined(
        user.collections?.map(c => afterPrefix(c, `${name}:`)) ?? [],
    )
    return result
}

function combineCollections(collections: DbCollection[]): DbCollection {
    const all = collections.reduce((res, curr) => res.concat(curr))
    const result = uniq(all)
    return result
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
    )
    return result ? true : false
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
    )
    return result ? true : false
}

export async function addUpload(userId: string, uploadId: string) {
    return addToCollection(userId, 'uploads', `uu/${uploadId}`)
}
