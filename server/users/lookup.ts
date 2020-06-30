import { DbUser, collection } from './schema';


export async function forId(id: string) {
    return collection.findById(id).exec();
}

export type UserInfo = {
    id: string,
    name: string,
    email?: string,
    pictureUrl?: string,
}
export async function forFacebook(facebookUser: UserInfo) {
    const result = await collection
        .findOne({ facebookId: facebookUser.id })
        .exec();

    let doc: typeof result;
    if (result) {
        result.name = facebookUser.name;
        result.pictureUrl = facebookUser.pictureUrl;
        await result.save();
        doc = result;
    } else {
        const toAdd: DbUser = {
            facebookId: facebookUser.id,
            name: facebookUser.name,
            pictureUrl: facebookUser.pictureUrl,
            joined: new Date(),
        };
        const [insertResult] = await collection.insertMany([toAdd]);
        doc = insertResult;
    }

    return {
        _id: doc._id.toString() as string,
        name: doc.name,
        pictureUrl: doc.pictureUrl,
        joined: doc.joined,
    };
}

export async function forApple({ id, name }: {
    id: string,
    name: string,
    email?: string,
}) {
    const result = await collection
        .findOne({ appleId: id })
        .exec();

    let doc: typeof result;
    if (result) {
        result.name = name;
        await result.save();
        doc = result;
    } else {
        const toAdd: DbUser = {
            appleId: id,
            name,
            joined: new Date(),
        };
        const [insertResult] = await collection.insertMany([toAdd]);
        doc = insertResult;
    }

    return {
        _id: doc._id.toString() as string,
        name: doc.name,
        pictureUrl: doc.pictureUrl,
        joined: doc.joined,
    };
}