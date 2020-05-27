import { IResolvers } from 'apollo-server';
import { DbHighlight } from '../users';
import { forId } from '../books';
import { BooqParent } from './booq';

export type HighlightParent = DbHighlight;
export const highlightResolver: IResolvers<HighlightParent> = {
    Highlight: {
        async booq(parent): Promise<BooqParent | undefined> {
            return forId(parent.booqId);
        },
    },
};
