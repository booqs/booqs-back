import { typedModel } from '../utils';

const schema = {
    title: {
        type: String,
        index: true,
    },
    author: {
        type: String,
        index: true,
    },
    assetId: {
        type: String,
        required: true,
    },
    index: {
        type: Number,
        required: true,
    },
} as const;

export const docs = typedModel('pg-cards', schema);
