import { IResolvers } from 'apollo-server';
import { Context } from './context';
import {
    addBookmark, addHighlight, addCurrent,
    deleteBookmark, deleteHighlight, deleteCurrent,
} from '../data';
import { uuid } from '../utils';

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
    },
};
