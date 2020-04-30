import { BooqPath } from 'booqs-core';
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
type DbHighlightInput = Pick<DbHighlight, 'uuid' | 'bookId' | 'bookSource' | 'start' | 'end' | 'group'>;
type DbHighlightUpdate = Pick<DbHighlight, 'uuid'> & Partial<DbHighlightInput>;

async function forBook(accountId: string, bookId: string, bookSource: string) {
    return collection
        .find({ accountId, bookId, bookSource })
        .exec();
}

async function addHighlight(accountId: string, highlight: DbHighlightInput) {
    const doc: DbHighlight = {
        accountId,
        ...highlight,
    };

    await collection.updateOne(
        { accountId, uuid: highlight.uuid },
        doc,
        { upsert: true },
    );
    return { uuid: highlight.uuid };
}

async function update(accountId: string, updates: DbHighlightUpdate) {
    const result = await collection.findOneAndUpdate(
        { accountId, uuid: updates.uuid },
        updates,
    ).exec();
    return result && { uuid: updates.uuid };
}

async function doDelete(accountId: string, highlightId: string) {
    const result = await collection
        .findOneAndDelete({ uuid: highlightId, accountId })
        .exec();
    return result ? true : false;
}

export const highlights = {
    forBook,
    addHighlight,
    update,
    delete: doDelete,
};
