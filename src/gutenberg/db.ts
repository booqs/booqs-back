import { typedModel, TypeFromSchema } from '../mongoose';

const schema = {
    assetId: {
        type: String,
        required: true,
    },
    index: {
        type: Number,
        required: true,
        index: true,
        unique: true,
    },
    title: String,
    author: String,
    language: String,
    description: String,
    subjects: [String],
    meta: Object,
    cover: String,
    coverSizes: Object,
} as const;

export type PgCard = TypeFromSchema<typeof schema>;
export const pgCards = typedModel('pg-cards', schema);
