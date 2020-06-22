import { IResolvers } from 'apollo-server';
import { textForRange } from '../../core';
import { DbHighlight } from '../highlights';
import { forId, booqForId } from '../books';
import { BooqParent } from './booq';
import { DbUser, forId as userForId } from '../users';

export type HighlightParent = DbHighlight;
export const highlightResolver: IResolvers<HighlightParent> = {
    Highlight: {
        async author(parent): Promise<DbUser | null> {
            return userForId(parent.userId);
        },
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
