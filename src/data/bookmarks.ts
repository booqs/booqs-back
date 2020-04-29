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

type Bookmark = TypeFromSchema<typeof schema>;
const docs = typedModel('bookmarks', schema);

type BookmarkPost = Pick<Bookmark, 'uuid' | 'bookId' | 'bookSource' | 'path'>;

async function addBookmark(accountId: string, bm: BookmarkPost) {
    const toAdd: Bookmark = {
        accountId,
        uuid: bm.uuid,
        bookId: bm.bookId,
        bookSource: bm.bookSource,
        path: bm.path,
    };
    const [result] = await docs.insertMany([toAdd]);

    return {
        uuid: result.uuid,
        bookSource: result.bookSource,
        bookId: result.bookId,
        path: result.path,
    };
}

async function forBook(accountId: string, bookId: string, bookSource: string): Promise<Bookmark[]> {
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
