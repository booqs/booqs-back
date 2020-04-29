import { typedModel, TypeFromSchema } from '../mongoose';
import { FacebookUser } from './facebook';

const schema = {
    facebookId: String,
    name: {
        type: String,
        required: true,
    },
    pictureUrl: String,
    joined: {
        type: Date,
        required: true,
    },
} as const;
type Account = TypeFromSchema<typeof schema>;
const docs = typedModel('accounts', schema);

export async function forId(id: string) {
    const result = await docs.findById(id).exec();
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

export async function forFacebook(facebookUser: FacebookUser) {
    const result = await docs
        .findOne({ facebookId: facebookUser.id })
        .exec();

    let doc: typeof result;
    if (result) {
        result.name = facebookUser.name;
        result.pictureUrl = facebookUser.profilePicture;
        await result.save();
        doc = result;
    } else {
        const toAdd: Account = {
            facebookId: facebookUser.id,
            name: facebookUser.name,
            pictureUrl: facebookUser.profilePicture,
            joined: new Date(),
        };
        const [insertResult] = await docs.insertMany([toAdd]);
        doc = insertResult;
    }

    return {
        _id: doc._id.toString(),
        name: doc.name,
        pictureUrl: doc.pictureUrl,
        joined: doc.joined,
    };
}
