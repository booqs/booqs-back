import { typedModel, TypeFromSchema, taggedObject } from '../mongoose';

const schema = {
    assetId: {
        type: String,
        required: true,
    },
    index: {
        type: String,
        required: true,
        index: true,
        unique: true,
    },
    title: String,
    author: String,
    language: String,
    description: String,
    subjects: [String],
    meta: taggedObject<object>(),
    cover: String,
    coverSizes: taggedObject<CoverSizes>(),
} as const;

type CoverSizes = {
    [size: number]: string,
};

export type DbPgCard = TypeFromSchema<typeof schema>;
export const collection = typedModel('pg-cards', schema);
