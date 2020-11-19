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
    comment: {
        type: Object,
        required: true,
    },
} as const;
export const collection = typedModel('comments', schema);

export type DbComment = TypeFromSchema<typeof schema>;
