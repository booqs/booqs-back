import { BooqPath, BooqId } from 'booqs-core';
import { ObjectId, taggedObject, typedModel, TypeFromSchema } from '../mongoose';

const schema = {
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
            booqId: input.booqId,
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
