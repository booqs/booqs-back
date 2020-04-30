import { BooqPath, BooqId } from 'booqs-core';
import { taggedObject, ObjectId, typedModel, TypeFromSchema } from '../mongoose';

const schema = {
    uuid: {
        type: String,
        required: true,
    },
    accountId: {
        type: ObjectId,
        required: true,
    },
    booqId: {
        type: taggedObject<BooqId>(),
        required: true,
    },
    group: {
        type: String,
        required: true,
    },
    start: {
        type: taggedObject<BooqPath>(),
        required: true,
    },
    end: {
        type: taggedObject<BooqPath>(),
        required: true,
    },
} as const;

const collection = typedModel('highlights', schema);
export type DbHighlight = TypeFromSchema<typeof schema>;
type DbHighlightUpdate = Partial<DbHighlight>;

async function forBook(accountId: string, booqId: BooqId) {
    return collection
        .find({ accountId, booqId })
        .exec();
}

async function addHighlight(highlight: DbHighlight) {

    await collection.updateOne(
        { accountId: highlight.accountId, uuid: highlight.uuid },
        highlight,
        { upsert: true },
    );
    return { uuid: highlight.uuid };
}

async function update(updates: DbHighlightUpdate) {
    const result = await collection.findOneAndUpdate(
        { accountId: updates.accountId, uuid: updates.uuid },
        updates,
    ).exec();
    return result && { uuid: updates.uuid };
}

async function doDelete(accountId: string, uuid: string) {
    const result = await collection
        .findOneAndDelete({ uuid, accountId })
        .exec();
    return result ? true : false;
}

export const highlights = {
    forBook,
    addHighlight,
    update,
    delete: doDelete,
};
