import { forId, forFacebook, forApple } from './lookup';
import { addBookmark, deleteBookmark, userBookmarks } from './bookmarks';
import {
    addUpload, addToCollection, removeFromCollection, userCollection,
} from './collections';
import { userBooqHistory, addBooqHistory, deleteBooqHistory } from './history';

export type { DbUser } from './schema';
export type { DbBooqHistory } from './history';
export type { DbBookmark } from './bookmarks';
export type { UserInfo } from './lookup';
export const users = {
    forId, forFacebook, forApple,
    userBookmarks, addBookmark, deleteBookmark,
    userCollection, addUpload, addToCollection, removeFromCollection,
    userBooqHistory, addBooqHistory, deleteBooqHistory,
};
