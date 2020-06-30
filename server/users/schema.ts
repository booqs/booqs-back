import { BooqPath } from '../../core';
import { typedModel, TypeFromSchema, taggedObject } from '../mongoose';

const schema = {
    facebookId: String,
    appleId: String,
    name: {
        type: String,
        required: true,
    },
    joined: {
        type: Date,
        required: true,
    },
    pictureUrl: String,
    bookmarks: taggedObject<StringMap<BookmarkData>>(),
    history: taggedObject<StringMap<StringMap<BooqHistoryData>>>(),
    collections: [String],
} as const;
export const collection = typedModel('users', schema);

export type DbUser = TypeFromSchema<typeof schema>;

type StringMap<T> = {
    [k: string]: T,
};
export type BookmarkData = {
    booqId: string,
    path: BooqPath,
};
export type HighlightData = {
    booqId: string,
    start: BooqPath,
    end: BooqPath,
    group: string,
};
export type BooqHistoryData = {
    path: BooqPath,
    date: Date,
};
