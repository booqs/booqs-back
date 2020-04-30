import { ObjectId, typedModel, TypeFromSchema } from '../mongoose';

const schema = {
    uuid: {
        type: String,
        required: true,
    },
    accountId: {
        type: ObjectId,
        required: true,
    },
    bookId: {
        type: String,
        required: true,
    },
    bookSource: {
        type: String,
        required: true,
    },
    group: {
        type: String,
        required: true,
    },
    start: {
        type: [Number],
        required: true,
    },
    end: {
        type: [Number],
        required: true,
    },
} as const;

const collection = typedModel('highlights', schema);
export type DbHighlight = TypeFromSchema<typeof schema>;
type DbHighlightUpdate = Partial<DbHighlight>;

type BookLookup = Pick<DbHighlight, 'accountId' | 'bookId' | 'bookSource'>;
async function forBook(lookup: BookLookup) {
    return collection
        .find(lookup)
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
