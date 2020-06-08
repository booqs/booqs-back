import { ReadStream } from 'fs';
import { IResolvers } from 'apollo-server';
import { uuid } from '../../core';
import {
    addBookmark, addHighlight, addBooqHistory,
    deleteBookmark, deleteHighlight, deleteBooqHistory, addToCollection, removeFromCollection, updateHighlight,
} from '../users';
import { Context } from './context';
import { uploadToSource } from '../books';

export const mutationResolver: IResolvers<any, Context> = {
    Mutation: {
        async addBookmark(_, { bookmark }, { user }) {
            if (user) {
                return addBookmark(
                    user._id,
                    {
                        id: bookmark.id ?? uuid(),
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
            if (user) {
                return addHighlight(
                    user._id,
                    {
                        id: highlight.id ?? uuid(),
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
                return deleteHighlight(
                    user._id,
                    { id },
                );
            } else {
                return false;
            }
        },
        async updateHighlight(_, { id, group }, { user }) {
            if (user) {
                return updateHighlight(
                    user._id,
                    { id, group },
                );
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
