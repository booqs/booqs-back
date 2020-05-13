import { ReadStream } from 'fs';
import { IResolvers } from 'apollo-server';
import {
    addBookmark, addHighlight, addCurrent,
    deleteBookmark, deleteHighlight, deleteCurrent, addToCollection, removeFromCollection,
} from '../data';
import { uuid } from '../utils';
import { Context } from './context';
import { uploadEpub } from '../books';

export const mutationResolver: IResolvers<any, Context> = {
    Mutation: {
        async addBookmark(_, { bm }, context) {
            if (context.user) {
                return addBookmark(
                    context.user?._id,
                    {
                        uuid: bm.uuid ?? uuid(),
                        booqId: bm.booqId,
                        path: bm.path,
                    });
            } else {
                return false;
            }
        },
        async removeBookmark(_, { uuid }, context) {
            if (context.user) {
                return deleteBookmark(
                    context.user._id,
                    { uuid },
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
                        uuid: hl.uuid ?? uuid(),
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
        async removeHighlight(_, { uuid }, context) {
            if (context.user) {
                return deleteHighlight(
                    context.user._id,
                    { uuid },
                );
            } else {
                return false;
            }
        },
        async addCurrent(_, { current }, context) {
            if (context.user?._id) {
                return addCurrent(
                    context.user?._id,
                    {
                        booqId: current.booqId,
                        path: current.path,
                        source: current.source,
                        date: new Date(Date.now()),
                    });
            } else {
                return false;
            }
        },
        async removeCurrent(_, { booqId }, context) {
            if (context.user) {
                return deleteCurrent(
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
                const card = await uploadEpub(stream, user._id);
                return card;
            }

            return undefined;
        },
    },
};
