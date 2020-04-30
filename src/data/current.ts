import { ObjectId, typedModel, TypeFromSchema } from '../mongoose';

const schema = {
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
    path: {
        type: [Number],
        required: true,
    },
    sourceId: {
        type: String,
        required: true,
    },
    created: {
        type: Date,
        required: true,
    },
} as const;

const collection = typedModel('currents', schema);
export type DbCurrent = TypeFromSchema<typeof schema>;

async function addCurrent(input: DbCurrent) {
    await collection.findOneAndUpdate(
        {
            accountId: input.accountId,
            bookId: input.bookId,
            bookSource: input.bookSource,
            sourceId: input.sourceId,
        },
        input,
        { upsert: true },
    ).exec();

    return true;
}

async function forAccount(accountId: string) {
    return collection.find({ accountId }).exec();
}

export const currents = {
    addCurrent,
    forAccount,
};
