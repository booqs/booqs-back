import { BooqPath } from 'booqs-core';
import { ObjectId, typedModel, TypeFromSchema, taggedObject } from '../mongoose';

const schema = {
    uuid: {
        type: String,
        required: true,
        unique: true,
    },
    accountId: {
        type: ObjectId,
        required: true,
    },
    bookSource: {
        type: String,
        required: true,
    },
    bookId: {
        type: String,
        required: true,
    },
    path: {
        type: taggedObject<BooqPath>(),
        required: true,
    },
} as const;

export type DbBookmark = TypeFromSchema<typeof schema>;
const docs = typedModel('bookmarks', schema);

type DbBookmarkInput = Pick<DbBookmark, 'uuid' | 'bookId' | 'bookSource' | 'path'>;

async function addBookmark(accountId: string, bm: DbBookmarkInput) {
    const conditions = {
        accountId,
        uuid: bm.uuid,
    };
    const toAdd: DbBookmark = {
        ...conditions,
        bookId: bm.bookId,
        bookSource: bm.bookSource,
        path: bm.path,
    };
    await docs.updateOne(
        conditions,
        toAdd,
        { upsert: true },
    ).exec();

    return { uuid: bm.uuid };
}

async function forBook(accountId: string, bookId: string, bookSource: string): Promise<DbBookmark[]> {
    return docs
        .find({
            accountId, bookId, bookSource,
        })
        .exec();
}

async function doDelete(accountId: string, bookmarkId: string): Promise<boolean> {
    const result = await docs
        .findOneAndDelete({ uuid: bookmarkId, accountId })
        .exec();
    return result ? true : false;
}

export const bookmarks = {
    addBookmark,
    forBook,
    delete: doDelete,
};
