import slugify from 'slugify'
import { DbUser, collection } from './schema'
import { FbUser } from '../auth/facebook'


export async function forId(id: string) {
    return (await collection).findById(id).exec()
}

export type UserInfo = {
    _id: string,
    username: string,
    name: string,
    email?: string,
    pictureUrl?: string,
    joined: Date,
}
export async function forFacebook(facebookUser: FbUser): Promise<UserInfo> {
    const result = await (await collection)
        .findOne({ facebookId: facebookUser.id })
        .exec()

    let doc: typeof result
    if (result) {
        result.name = facebookUser.name
        result.pictureUrl = facebookUser.pictureUrl
        result.email = facebookUser.email
        await result.save()
        doc = result
    } else {
        let username = await proposeUsername(facebookUser)
        const toAdd: DbUser = {
            username,
            facebookId: facebookUser.id,
            name: facebookUser.name,
            pictureUrl: facebookUser.pictureUrl,
            email: facebookUser.email,
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

export async function forApple({ id, name, email }: {
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
        if (email) {
            result.email = email
        }
        await result.save()
        doc = result
    } else {
        let username = await proposeUsername({ id, name })
        const toAdd: DbUser = {
            username,
            appleId: id,
            name, email,
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
    if (name) {
        const names = name.split(' ')
            .map(n => slugify(n, {
                trim: true,
                lower: true,
            }))
            .map(n => n.replace(/[^a-z0-9]/g, ''))
            .filter(n => n.length > 0)
        let username = names.join('.')
        return username.length > 0 ? username : id
    } else if (email) {
        const emailParts = email.split('@')
        if (emailParts.length > 1) {
            return emailParts[0]
                .split('.')
                .map(n => slugify(n, {
                    trim: true,
                    lower: true,
                }))
                .map(n => n.replace(/[^a-z0-9]/g, ''))
                .filter(n => n.length > 0)
                .join('.')
        }
    }

    // Fallback to ID if no name or email is available
    return id
}