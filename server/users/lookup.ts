import slugify from 'slugify'
import { DbUser, collection } from './schema'
import { FbUser } from '../auth/facebook'


export async function forId(id: string): Promise<DbUser | null> {
    return (await collection).findById(id).exec()
}

export async function getOrCreateForEmail(email: string) {
    const result = await (await collection)
        .findOne({ email })
        .exec()
    if (result) {
        return {
            exists: true,
            user: result,
        }
    } else {
        let username = await proposeUsername({ id: email, email })
        const toAdd: Omit<DbUser, '_id'> = {
            username,
            joined: new Date(),
        }
        const [insertResult] = await (await collection).insertMany([toAdd])
        return {
            exists: false,
            user: insertResult,
        }
    }
}

export async function getOrCreateForFacebookUser(facebookUser: FbUser) {
    const result = await (await collection)
        .findOne({ facebookId: facebookUser.id })
        .exec()

    if (result) {
        result.name = facebookUser.name
        result.pictureUrl = facebookUser.pictureUrl
        await result.save()
        return {
            exists: true,
            user: result,
        }
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
        return {
            exists: false,
            user: insertResult,
        }
    }
}

export async function getOrCreateForAppleUser({ id, name }: {
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
        return {
            exists: true,
            user: result,
        }
    } else {
        let username = await proposeUsername({ id, name })
        const toAdd: Omit<DbUser, '_id'> = {
            username,
            appleId: id,
            name,
            joined: new Date(),
        }
        const [insertResult] = await (await collection).insertMany([toAdd])
        return {
            exists: false,
            user: insertResult,
        }
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