import { DbUser, collection } from './schema';


export async function forId(id: string) {
    return collection.findById(id).exec();
}

export type UserInfo = {
    id: string,
    name: string,
    profilePicture?: string,
}
export async function forFacebook(facebookUser: UserInfo) {
    const result = await collection
        .findOne({ facebookId: facebookUser.id })
        .exec();

    let doc: typeof result;
    if (result) {
        result.name = facebookUser.name;
        result.pictureUrl = facebookUser.profilePicture;
        await result.save();
        doc = result;
    } else {
        const toAdd: DbUser = {
            facebookId: facebookUser.id,
            name: facebookUser.name,
            pictureUrl: facebookUser.profilePicture,
            joined: new Date(),
        };
        const [insertResult] = await collection.insertMany([toAdd]);
        doc = insertResult;
    }

    return {
        _id: doc._id.toString(),
        name: doc.name,
        pictureUrl: doc.pictureUrl,
        joined: doc.joined,
    };
}