import { typedModel } from '../mongoose';

const schema = {
    booqId: {
        type: String,
        required: true,
    },
} as const;

const docs = typedModel('prepared-images', schema);

export async function isAlreadyPrepared(booqId: string) {
    return docs.exists({ booqId });
}

export async function markAsPrepared(booqId: string) {
    const [result] = await docs.insertMany([{
        booqId,
    }]);
    return result;
}
