import { ObjectId, typedModel, TypeFromSchema } from '../mongoose';

const schema = {
    uuid: {
        type: String,
        required: true,
        unique: true,
    },
    accountId: {
        type: ObjectId,
        required: true,
    },
    booqId: {
        type: String,
        required: true,
    },
    path: {
        type: [Number],
        required: true,
    },
} as const;

export type DbBookmark = TypeFromSchema<typeof schema>;
const collection = typedModel('bookmarks', schema);

async function addBookmark(bm: DbBookmark) {
    const result = await collection.updateOne(
        {
            accountId: bm.accountId,
            uuid: bm.uuid,
        },
        bm,
        { upsert: true },
    ).exec();

    return result ? true : false;
}

type BookLookup = Pick<DbBookmark, 'accountId' | 'booqId'>;
async function forBook(lookup: BookLookup) {
    return collection
        .find(lookup)
        .exec();
}

async function doDelete(accountId: string, uuid: string) {
    const result = await collection
        .findOneAndDelete({ uuid, accountId })
        .exec();
    return result ? true : false;
}

export const bookmarks = {
    addBookmark,
    forBook,
    delete: doDelete,
};
