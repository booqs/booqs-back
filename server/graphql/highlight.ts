import { IResolvers } from 'apollo-server';
import { DbHighlight } from '../users';
import { forId, booqForId } from '../books';
import { BooqParent } from './booq';
import { textForRange } from '../../core';

export type HighlightParent = DbHighlight;
export const highlightResolver: IResolvers<HighlightParent> = {
    Highlight: {
        async booq(parent): Promise<BooqParent | undefined> {
            return forId(parent.booqId);
        },
        async text(parent) {
            const booq = await booqForId(parent.booqId);
            if (booq) {
                return textForRange(booq.nodes, {
                    start: parent.start,
                    end: parent.end,
                });
            }
            return '<error>';
        },
    },
};
