import { IResolvers } from 'apollo-server';
import { textForRange } from '../../core';
import { DbHighlight } from '../highlights';
import { forId, booqForId } from '../books';
import { BooqParent } from './booq';

export type HighlightParent = DbHighlight;
export const highlightResolver: IResolvers<HighlightParent> = {
    Highlight: {
        async booq(parent): Promise<BooqParent | undefined> {
            return forId(parent.booqId);
        },
        async text(parent) {
            const booq = await booqForId(parent.booqId);
            if (booq) {
                const text = textForRange(booq.nodes, {
                    start: parent.start,
                    end: parent.end,
                });
                return text ?? '<no-text>';
            }
            return '<no-booq>';
        },
    },
};
