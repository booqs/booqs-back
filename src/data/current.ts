import { ObjectId, typedModel, TypeFromSchema } from '../mongoose';

const schema = {
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
    source: {
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
            source: input.source,
        },
        input,
        { upsert: true },
    ).exec();

    return true;
}

async function forAccount(lookup: Pick<DbCurrent, 'accountId'>) {
    return collection.find(lookup).exec();
}

export const currents = {
    addCurrent,
    forAccount,
};
