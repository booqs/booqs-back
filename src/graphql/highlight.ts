import { IResolvers } from 'apollo-server';
import { DbHighlight } from '../data';

export type HighlightParent = DbHighlight;
export const highlightResolver: IResolvers<HighlightParent> = {
    Highlight: {
        booqId(parent) {
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