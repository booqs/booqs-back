import slugify from 'slugify'
import { DbUser, collection } from './schema'
import { FbUser } from '../auth/facebook'
import { highlights } from '../highlights'
import { uuSource } from '../uploads'

export async function forId(id: string) {
    return (await collection).findById(id).exec()
}

export async function forEmail(email: string) {
    return (await collection).findOne({ email }).exec()
}

export async function createUser(user: Omit<DbUser, '_id' | 'username' | 'joined'>) {
    let username = await proposeUsername(user)
    const toAdd: Omit<DbUser, '_id'> = {
        ...user,
        username,
        joined: new Date(),
    }
    const [insertResult] = await (await collection).insertMany([toAdd])
    return insertResult
}

export async function updateOrCreateForFacebookUser(facebookUser: FbUser) {
    const result = await (await collection)
        .findOne({ facebookId: facebookUser.id })
        .exec()

    if (result) {
        result.name = facebookUser.name
        result.pictureUrl = facebookUser.pictureUrl
        await result.save()
        return result
    } else {
        let username = await proposeUsername(facebookUser)
        const toAdd: Omit<DbUser, '_id'> = {
            username,
            facebookId: facebookUser.id,
            name: facebookUser.name,
            pictureUrl: facebookUser.pictureUrl,
            joined: new Date(),
        }
        const [insertResult] = await (await collection).insertMany([toAdd])
        return insertResult
    }
}

export async function updateOrCreateForAppleUser({ id, name }: {
    id: string,
    name: string,
    email?: string,
}) {
    const result = await (await collection)
        .findOne({ appleId: id })
        .exec()

    if (result) {
        if (name) {
            result.name = name
        }
        await result.save()
        return result
    } else {
        let username = await proposeUsername({ name })
        const toAdd: Omit<DbUser, '_id'> = {
            username,
            appleId: id,
            name,
            joined: new Date(),
        }
        const [insertResult] = await (await collection).insertMany([toAdd])
        return insertResult
    }
}

export async function deleteForId(id: string): Promise<boolean> {
    let deleteUserPromise = (await collection).deleteOne({ _id: id }).exec()
    let deleteHighlightsPromise = highlights.removeAllForUserId(id)
    let deleteBooksPromise = uuSource.deleteAllBooksForUserId
        ? uuSource.deleteAllBooksForUserId(id) : Promise.resolve(true)

    let [deleteUserResult, deleteHighlightsResult, deleteBooksResult] = await Promise.all([
        deleteUserPromise, deleteHighlightsPromise, deleteBooksPromise,
    ])
    return deleteUserResult.deletedCount > 0 && deleteHighlightsResult && deleteBooksResult
}

type UserDataForNameGeneration = {
    name?: string,
    email?: string,
}
export async function proposeUsername(user: UserDataForNameGeneration) {
    let base = generateUsername(user)
    let current = base
    let next = current
    let idx = await (await collection).estimatedDocumentCount()
    let existing: any
    do {
        current = next
        existing = await (await collection)
            .findOne({ username: current })
            .exec()
        next = `${base}${++idx}`
    } while (existing)
    return current
}

function generateUsername({ name, email }: UserDataForNameGeneration) {
    let base = name ?? email ?? 'user'
    let username = slugify(base, {
        replacement: '.',
        lower: true,
        strict: true,
        locale: 'en',
    })
    return username
}