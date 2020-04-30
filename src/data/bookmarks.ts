import { BooqPath, BooqId } from 'booqs-core';
import { ObjectId, typedModel, TypeFromSchema, taggedObject } from '../mongoose';

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
        type: taggedObject<BooqId>(),
        required: true,
    },
    path: {
        type: taggedObject<BooqPath>(),
        required: true,
    },
} as const;

export type DbBookmark = TypeFromSchema<typeof schema>;
const collection = typedModel('bookmarks', schema);

async function addBookmark(bm: DbBookmark) {
    await collection.updateOne(
        {
            accountId: bm.accountId,
            uuid: bm.uuid,
        },
        bm,
        { upsert: true },
    ).exec();

    return { uuid: bm.uuid };
}

async function forBook(accountId: string, booqId: BooqId) {
    return collection
        .find({
            accountId, booqId,
        })
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
