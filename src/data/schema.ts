import { BooqPath, BooqRange } from 'booqs-core';
import { typedModel, TypeFromSchema, taggedObject } from '../mongoose';

const schema = {
    facebookId: String,
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
    highlights: [taggedObject<DbHighlight>()],
    currents: [taggedObject<DbCurrent>()],
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
export type DbHighlight = {
    uuid: string,
    booqId: string,
    range: BooqRange,
    group: string,
};
export type DbCurrent = {
    booqId: string,
    path: BooqPath,
    source: string,
    date: Date,
};
