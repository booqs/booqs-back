import { typedModel, TypeFromSchema } from '../mongoose';

const schema = {
    id: {
        type: String,
        required: true,
    },
    userId: {
        type: String,
        required: true,
    },
    booqId: {
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
    group: {
        type: String,
        required: true,
    },
} as const;
export const collection = typedModel('highlights', schema);

export type DbHighlight = TypeFromSchema<typeof schema>;
