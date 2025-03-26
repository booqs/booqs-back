import slugify from 'slugify'
import { DbUser, PasskeyCredentialData, collection } from './schema'
import { FbUser } from '../auth/facebook'

export type UserInfo = {
    _id: string,
    username: string,
    joined: Date,
    name?: string,
    email?: string,
    pictureUrl?: string,
    credentials?: PasskeyCredentialData[],
}

export async function forId(id: string): Promise<UserInfo | null> {
    return (await collection).findById(id).exec()
}

export async function getOrCreateForEmail(email: string): Promise<UserInfo> {
    const result = await (await collection)
        .findOne({ email })
        .exec()
    if (result) {
        return result
    } else {
        let username = await proposeUsername({ id: email, email })
        const toAdd: DbUser = {
            username,
            joined: new Date(),
        }
        const [insertResult] = await (await collection).insertMany([toAdd])
        return insertResult
    }
}

export async function getOrCreateForFacebookUser(facebookUser: FbUser): Promise<UserInfo> {
    const result = await (await collection)
        .findOne({ facebookId: facebookUser.id })
        .exec()

    let doc: typeof result
    if (result) {
        result.name = facebookUser.name
        result.pictureUrl = facebookUser.pictureUrl
        await result.save()
        doc = result
    } else {
        let username = await proposeUsername(facebookUser)
        const toAdd: DbUser = {
            username,
            facebookId: facebookUser.id,
            name: facebookUser.name,
            pictureUrl: facebookUser.pictureUrl,
            joined: new Date(),
        }
        const [insertResult] = await (await collection).insertMany([toAdd])
        doc = insertResult
    }

    return {
        _id: doc._id.toString() as string,
        username: doc.username,
        name: doc.name,
        pictureUrl: doc.pictureUrl,
        email: doc.email,
        joined: doc.joined,
    }
}

export async function getOrCreateForAppleUser({ id, name, email }: {
    id: string,
    name: string,
    email?: string,
}): Promise<UserInfo> {
    const result = await (await collection)
        .findOne({ appleId: id })
        .exec()

    let doc: typeof result
    if (result) {
        if (name) {
            result.name = name
        }
        await result.save()
        doc = result
    } else {
        let username = await proposeUsername({ id, name })
        const toAdd: DbUser = {
            username,
            appleId: id,
            name,
            joined: new Date(),
        }
        const [insertResult] = await (await collection).insertMany([toAdd])
        doc = insertResult
    }

    return {
        _id: doc._id.toString() as string,
        username: doc.username,
        name: doc.name,
        pictureUrl: doc.pictureUrl,
        email: doc.email,
        joined: doc.joined,
    }
}

type UserDataForNameGeneration = {
    id: string,
    name?: string,
    email?: string,
}
export async function proposeUsername(user: UserDataForNameGeneration) {
    let base = generateUsername(user)
    let current = base
    let next = current
    let idx = 0
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

function generateUsername({ name, id, email }: UserDataForNameGeneration) {
    let base = name ?? email ?? id ?? 'user'
    let username = slugify(base, {
        replacement: '.',
        lower: true,
        strict: true,
        locale: 'en',
    })
    return username
}