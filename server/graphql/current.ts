import { IResolvers } from 'apollo-server';
import { previewForPath } from '../../core';
import { DbBooqHistory } from '../users';
import { forId, booqForId } from '../books';
import { BooqParent } from './booq';

export type CurrentParent = DbBooqHistory;
export const currentResolver: IResolvers<CurrentParent> = {
    Current: {
        async booq(parent): Promise<BooqParent | undefined> {
            return forId(parent.booqId);
        },
        async preview(parent, { length }) {
            const booq = await booqForId(parent.booqId);
            if (!booq) {
                return undefined;
            }
            const preview = previewForPath(booq.nodes, parent.path, length);
            return preview?.trim()?.substr(0, length);
        },
    },
};
