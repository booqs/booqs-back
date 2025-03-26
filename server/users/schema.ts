import { BooqPath } from '../../core'
import { typedModel, TypeFromSchema, taggedObject } from '../mongoose'

const schema = {
    joined: {
        type: Date,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    name: String,
    facebookId: String,
    appleId: String,
    pictureUrl: String,
    email: String,
    bookmarks: taggedObject<StringMap<BookmarkData>>(),
    history: taggedObject<StringMap<StringMap<BooqHistoryData>>>(),
    collections: [String],
    credentials: [taggedObject<PasskeyCredentialData>()],
} as const
export const collection = typedModel('users', schema)

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
export type PasskeyCredentialData = {
    id: string,
    publicKey: string,
    counter: number,
}
