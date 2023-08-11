import slugify from 'slugify'
import { DbUser, collection } from './schema'


export async function forId(id: string) {
    return (await collection).findById(id).exec()
}

export type UserInfo = {
    id: string,
    name?: string,
    email?: string,
    pictureUrl?: string,
}
export async function forFacebook(facebookUser: UserInfo) {
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
        name: doc.name,
        pictureUrl: doc.pictureUrl,
        email: doc.email,
        joined: doc.joined,
    }
}

export async function forApple({ id, name, email }: {
    id: string,
    name?: string,
    email?: string,
}) {
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
        let username = await proposeUsername({ id, name, email })
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
        name: doc.name,
        pictureUrl: doc.pictureUrl,
        email: doc.email,
        joined: doc.joined,
    }
}

export async function proposeUsername(user: UserInfo) {
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

function generateUsername(user: UserInfo) {
    if (!user.name) {
        return user.id
    }
    const names = user.name.split(' ')
        .map(name => slugify(name, {
            trim: true,
            lower: true,
        }))
        .map(name => name.replace(/[^a-z0-9]/g, ''))
        .filter(name => name.length > 0)
    let username = names.join('.')
    return username.length > 0 ? username : user.id
}