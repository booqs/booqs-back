import { IResolvers } from 'apollo-server';
import { BooqId } from 'booqs-core';
import { DbHighlight } from '../data';

export type HighlightParent = DbHighlight;
export const highlightResolver: IResolvers<HighlightParent> = {
    Highlight: {
        booqId(parent): BooqId {
            return {
                id: parent.bookId,
                source: parent.bookSource,
            };
        },
        range(parent) {
            return {
                start: parent.start,
                end: parent.end,
            };
        },
    },
};