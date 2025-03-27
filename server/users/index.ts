import {
    forId, forEmail,
    updateOrCreateForAppleUser, updateOrCreateForFacebookUser,
    createIfNewForEmail,
    deleteForId,
} from './crud'
import { addBookmark, deleteBookmark, userBookmarks } from './bookmarks'
import {
    addUpload, addToCollection, removeFromCollection, userCollection,
} from './collections'
import { userBooqHistory, addBooqHistory, deleteBooqHistory } from './history'

export type { DbUser } from './schema'
export type { DbBooqHistory } from './history'
export type { DbBookmark } from './bookmarks'
export const users = {
    forId, forEmail,
    updateOrCreateForAppleUser, updateOrCreateForFacebookUser,
    createIfNewForEmail,
    userBookmarks, addBookmark, deleteBookmark,
    userCollection, addUpload, addToCollection, removeFromCollection,
    userBooqHistory, addBooqHistory, deleteBooqHistory,
    deleteForId,
}
