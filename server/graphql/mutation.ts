import { ReadStream } from 'fs';
import { IResolvers } from 'apollo-server';
import {
    addBookmark, addHighlight, addBooqHistory,
    deleteBookmark, deleteHighlight, deleteBooqHistory, addToCollection, removeFromCollection,
} from '../users';
import { uuid } from '../utils';
import { Context } from './context';
import { uploadToSource } from '../books';

export const mutationResolver: IResolvers<any, Context> = {
    Mutation: {
        async addBookmark(_, { bm }, context) {
            if (context.user) {
                return addBookmark(
                    context.user?._id,
                    {
                        id: bm.id ?? uuid(),
                        booqId: bm.booqId,
                        path: bm.path,
                    });
            } else {
                return false;
            }
        },
        async removeBookmark(_, { id }, context) {
            if (context.user) {
                return deleteBookmark(
                    context.user._id,
                    { id },
                );
            } else {
                return false;
            }
        },
        async addHighlight(_, { hl }, context) {
            if (context.user) {
                return addHighlight(
                    context.user?._id,
                    {
                        id: hl.id ?? uuid(),
                        booqId: hl.booqId,
                        range: {
                            start: hl.start,
                            end: hl.end,
                        },
                        group: hl.group,
                    });
            } else {
                return false;
            }
        },
        async removeHighlight(_, { id }, context) {
            if (context.user) {
                return deleteHighlight(
                    context.user._id,
                    { id },
                );
            } else {
                return false;
            }
        },
        async addBooqHistory(_, { event }, context) {
            if (context.user?._id) {
                return addBooqHistory(
                    context.user?._id,
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
        async removeBooqHistory(_, { booqId }, context) {
            if (context.user) {
                return deleteBooqHistory(
                    context.user._id,
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
        async uploadEpub(_, { file }, { user }) {
            if (user?._id) {
                const actual = await file;
                const stream: ReadStream = actual.createReadStream();
                const card = await uploadToSource('uu', stream, user._id);
                return card;
            }

            return undefined;
        },
    },
};
