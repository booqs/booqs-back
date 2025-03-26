import { forId, getOrCreateForFacebookUser, getOrCreateForAppleUser, getOrCreateForEmail } from './lookup'
import { addBookmark, deleteBookmark, userBookmarks } from './bookmarks'
import {
    addUpload, addToCollection, removeFromCollection, userCollection,
} from './collections'
import { userBooqHistory, addBooqHistory, deleteBooqHistory } from './history'
import { deleteForId } from './update'

export type { DbUser } from './schema'
export type { DbBooqHistory } from './history'
export type { DbBookmark } from './bookmarks'
export type { UserInfo } from './lookup'
export const users = {
    forId,
    getOrCreateForFacebookUser, getOrCreateForAppleUser, getOrCreateForEmail,
    userBookmarks, addBookmark, deleteBookmark,
    userCollection, addUpload, addToCollection, removeFromCollection,
    userBooqHistory, addBooqHistory, deleteBooqHistory,
    deleteForId,
}
