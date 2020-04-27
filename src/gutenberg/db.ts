import { typedModel, TypeFromSchema } from '../utils';

const schema = {
    title: String,
    author: String,
    assetId: {
        type: String,
        required: true,
    },
    index: {
        type: Number,
        required: true,
        index: true,
    },
    meta: Object,
} as const;

export type PgCard = TypeFromSchema<typeof schema>;
export const pgCards = typedModel('pg-cards', schema);
