import { ReadStream } from 'fs';
import { IResolvers } from 'apollo-server';
import { uniqueId } from '../../core';
import {
    addBookmark, deleteBookmark,
    addToCollection, removeFromCollection,
    addBooqHistory, deleteBooqHistory,
} from '../users';
import { uploadToSource } from '../books';
import { highlights } from '../highlights';
import { Context } from './context';

export const mutationResolver: IResolvers<any, Context> = {
    Mutation: {
        async addBookmark(_, { bookmark }, { user }) {
            if (user) {
                return addBookmark(
                    user._id,
                    {
                        id: bookmark.id ?? uniqueId(),
                        booqId: bookmark.booqId,
                        path: bookmark.path,
                    });
            } else {
                return false;
            }
        },
        async removeBookmark(_, { id }, { user }) {
            if (user) {
                return deleteBookmark(
                    user._id,
                    { id },
                );
            } else {
                return false;
            }
        },
        async addHighlight(_, { highlight }, { user }) {
            if (user?._id) {
                return highlights.add({
                    userId: user._id,
                    id: highlight.id,
                    booqId: highlight.booqId,
                    start: highlight.start,
                    end: highlight.end,
                    group: highlight.group,
                });
            } else {
                return false;
            }
        },
        async removeHighlight(_, { id }, { user }) {
            if (user) {
                return highlights.remove({
                    userId: user._id,
                    id: id,
                });
            } else {
                return false;
            }
        },
        async updateHighlight(_, { id, group }, { user }) {
            if (user) {
                return highlights.update({
                    userId: user._id,
                    id: id,
                    group,
                });
            } else {
                return false;
            }
        },
        async addBooqHistory(_, { event }, { user }) {
            if (user) {
                return addBooqHistory(
                    user._id,
                    {
                        booqId: event.booqId,
                        path: event.path,
                        source: event.source,
                        date: new Date(Date.now()),
                    });
            } else {
                return false;
            }
        },
        async removeBooqHistory(_, { booqId }, { user }) {
            if (user) {
                return deleteBooqHistory(
                    user._id,
                    { booqId },
                );
            } else {
                return false;
            }
        },
        async addToCollection(_, { booqId, name }, { user }) {
            if (user) {
                return addToCollection(
                    user._id,
                    name,
                    booqId,
                );
            } else {
                return false;
            }
        },
        async removeFromCollection(_, { booqId, name }, { user }) {
            if (user) {
                return removeFromCollection(
                    user._id,
                    name,
                    booqId,
                );
            } else {
                return false;
            }
        },
        async uploadEpub(_, { file, source }, { user }) {
            if (user?._id) {
                const actual = await file;
                const stream: ReadStream = actual.createReadStream();
                const card = await uploadToSource('uu', stream, user._id);
                if (card) {
                    addBooqHistory(
                        user?._id,
                        {
                            booqId: card.id,
                            path: [0],
                            source: source,
                            date: new Date(Date.now()),
                        },
                    );
                    return card;
                }
            }

            return undefined;
        },
    },
};
