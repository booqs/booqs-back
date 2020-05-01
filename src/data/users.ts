import { typedModel, TypeFromSchema } from '../mongoose';

const schema = {
    facebookId: String,
    name: {
        type: String,
        required: true,
    },
    joined: {
        type: Date,
        required: true,
    },
    pictureUrl: String,
} as const;
const collection = typedModel('users', schema);

export type DbUser = TypeFromSchema<typeof schema>;

type UserInfo = {
    id: string,
    name: string,
    profilePicture?: string,
}

export async function forId(id: string) {
    const result = await collection.findById(id).exec();
    if (!result) {
        return undefined;
    }

    return {
        _id: result._id,
        name: result.name,
        joined: result.joined,
        pictureUrl: result.pictureUrl,
    };
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
